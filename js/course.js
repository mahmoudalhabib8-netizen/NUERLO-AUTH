/**
 * Dynamic Course View Engine
 * Handles authentication, enrollment verification, and dynamic content loading
 */

// Course data cache
let currentCourseData = null;
let currentUserData = null;
let courseId = null;

/**
 * Extract course ID from sessionStorage or URL pathname
 * NEW: Uses clean routes like /lessons, /overview (courseId stored in sessionStorage)
 * Supports formats: 
 * - NEW: sessionStorage (most reliable - persists across refreshes)
 * - Legacy: /{courseId}/{section} - all sections including overview use the same format
 * - Legacy: /course/<courseId> or /acct_xxx/course/<courseId>
 */
function extractCourseIdFromUrl() {
    // CRITICAL: Check sessionStorage FIRST (most reliable - persists across refreshes and navigation)
    // This is set when entering course from dashboard or when course.js initializes
    const storedCourseId = sessionStorage.getItem('currentCourseId');
    if (storedCourseId) {
        console.log('Extracted course ID from sessionStorage:', storedCourseId);
        return storedCourseId;
    }
    
    // Check body attribute (set by course.js)
    if (document.body && document.body.hasAttribute('data-course-id')) {
        const courseId = document.body.getAttribute('data-course-id');
        console.log('Extracted course ID from body attribute:', courseId);
        return courseId;
    }
    
    // Check window global (set by course.js)
    if (window.currentCourseId) {
        console.log('Extracted course ID from window.currentCourseId:', window.currentCourseId);
        return window.currentCourseId;
    }
    
    // Fallback: Try to extract from URL (legacy support)
    const pathname = window.location.pathname;
    
    // Check for /<courseId>/<section> pattern (legacy format)
    const courseSectionMatch = pathname.match(/^\/([^\/]+)\/([^\/]+)$/);
    if (courseSectionMatch && courseSectionMatch[1] && courseSectionMatch[2]) {
        const potentialCourseId = courseSectionMatch[1];
        const potentialSection = courseSectionMatch[2];
        const courseSections = ['details', 'lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];
        const dashboardSections = ['programs', 'credentials', 'marketplace', 
                                  'tasks', 'community', 'profile', 'settings', 'subscriptions', 'help',
                                  'dashboard', 'login', 'register', 'course'];
        
        // If the section is a course section (including overview) and the first part is not a dashboard section, it's a course
        if (courseSections.includes(potentialSection) && !dashboardSections.includes(potentialCourseId)) {
            console.log('Extracted course ID from legacy URL format (section):', potentialCourseId);
            return potentialCourseId;
        }
    }
    
    // Legacy support: Check for /acct_xxx/<courseId>/course pattern (old overview format)
    const accountCourseMatch = pathname.match(/\/acct_[^\/]+\/([^\/]+)\/course/);
    if (accountCourseMatch && accountCourseMatch[1]) {
        const courseId = accountCourseMatch[1];
        console.log('Extracted course ID from account-prefixed URL (legacy):', courseId);
        return courseId;
    }
    
    // Legacy support: Check for /<courseId>/course pattern (old overview format)
    const newFormatMatch = pathname.match(/\/([^\/]+)\/course/);
    if (newFormatMatch && newFormatMatch[1]) {
        const courseId = newFormatMatch[1];
        console.log('Extracted course ID from legacy format URL (overview):', courseId);
        return courseId;
    }
    
    // Check for /acct_xxx/<courseId>/<section> pattern (legacy format with account prefix - sections)
    const accountCourseSectionMatch = pathname.match(/\/acct_[^\/]+\/([^\/]+)\/([^\/]+)$/);
    if (accountCourseSectionMatch && accountCourseSectionMatch[1] && accountCourseSectionMatch[2]) {
        const potentialCourseId = accountCourseSectionMatch[1];
        const potentialSection = accountCourseSectionMatch[2];
        const courseSections = ['lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];
        if (courseSections.includes(potentialSection)) {
            console.log('Extracted course ID from account-prefixed URL (section):', potentialCourseId);
            return potentialCourseId;
        }
    }
    
    // Legacy support: /acct_xxx/course/<courseId> pattern
    const legacyAccountMatch = pathname.match(/\/acct_[^\/]+\/course\/([^\/]+)/);
    if (legacyAccountMatch && legacyAccountMatch[1]) {
        const courseId = legacyAccountMatch[1];
        console.log('Extracted course ID from legacy account-prefixed URL:', courseId);
        return courseId;
    }
    
    // Legacy support: /course/<courseId> pattern
    const legacyCourseMatch = pathname.match(/\/course\/([^\/]+)/);
    if (legacyCourseMatch && legacyCourseMatch[1]) {
        const courseId = legacyCourseMatch[1];
        console.log('Extracted course ID from legacy URL:', courseId);
        return courseId;
    }
    
    // Fallback: check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId') || urlParams.get('id') || null;
    if (courseId) {
        console.log('Extracted course ID from URL params:', courseId);
    }
    return courseId;
}

/**
 * Verify user is authenticated
 * Returns the user object if authenticated, null otherwise
 */
async function verifyAuthentication() {
    return new Promise((resolve) => {
        if (!window.firebase || !window.firebase.auth) {
            console.error('Firebase auth not available');
            resolve(null);
            return;
        }

        // Check current user first (synchronous)
        const currentUser = window.firebase.auth.currentUser;
        if (currentUser) {
            console.log('User already authenticated:', currentUser.uid, currentUser.email);
            resolve(currentUser);
            return;
        }

        // If no current user, wait for auth state change
        const unsubscribe = window.firebase.auth.onAuthStateChanged((user) => {
            unsubscribe(); // Unsubscribe after first check
            if (user) {
                console.log('User authenticated via onAuthStateChanged:', user.uid, user.email);
                resolve(user);
            } else {
                console.error('No user authenticated');
                resolve(null);
            }
        });
        
        // Timeout after 3 seconds
        setTimeout(() => {
            unsubscribe();
            if (!currentUser) {
                console.error('Authentication check timeout');
                resolve(null);
            }
        }, 3000);
    });
}

/**
 * Get current authenticated user
 */
function getCurrentUser() {
    return new Promise((resolve) => {
        if (!window.firebase || !window.firebase.auth) {
            resolve(null);
            return;
        }

        window.firebase.auth.onAuthStateChanged((user) => {
            resolve(user);
        });
    });
}

/**
 * Check if user is enrolled in the course
 * Handles type mismatches (string vs number) and logs for debugging
 */
async function checkEnrollment(userId, courseId) {
    try {
        if (!window.firebase || !window.firebase.db) {
            console.error('Firebase not initialized');
            return false;
        }

        if (!userId || !courseId) {
            console.error('Missing userId or courseId:', { userId, courseId });
            return false;
        }

        console.log('Checking enrollment for user:', userId, 'course:', courseId);
        
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userDocRef = doc(window.firebase.db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.error('User document does not exist:', userId);
            return false;
        }

        const userData = userDoc.data();
        const enrolledCourses = userData.enrolledCourses || [];
        
        console.log('User enrolledCourses:', enrolledCourses);
        console.log('Looking for courseId:', courseId, 'Type:', typeof courseId);
        
        // Check with type coercion to handle string/number mismatches
        const isEnrolled = enrolledCourses.some(id => 
            String(id) === String(courseId) || id === courseId
        );
        
        console.log('Enrollment check result:', isEnrolled);
        
        if (!isEnrolled) {
            console.warn('User not enrolled. Enrolled courses:', enrolledCourses, 'Looking for:', courseId);
        }
        
        return isEnrolled;
    } catch (error) {
        console.error('Error checking enrollment:', error);
        console.error('Error details:', error.message, error.stack);
        return false;
    }
}

/**
 * Fetch course data from Firestore
 */
async function fetchCourseData(courseId) {
    try {
        if (!window.firebase || !window.firebase.db) {
            throw new Error('Firebase not initialized');
        }

        console.log('Fetching course data for ID:', courseId);
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const courseDocRef = doc(window.firebase.db, 'courses', courseId);
        const courseDoc = await getDoc(courseDocRef);

        if (!courseDoc.exists()) {
            console.error('Course document does not exist for ID:', courseId);
            throw new Error(`Course not found: ${courseId}`);
        }

        const courseData = {
            id: courseDoc.id,
            ...courseDoc.data()
        };
        
        console.log('Course data fetched successfully:', courseData.title || courseData.name || courseData.id);
        
        // Store course ID globally for debugging
        window.currentCourseId = courseId;
        window.currentCourseData = courseData;
        
        return courseData;
    } catch (error) {
        console.error('Error fetching course data:', error);
        console.error('Course ID attempted:', courseId);
        throw error;
    }
}

/**
 * Get all enrolled courses for a user
 */
async function getEnrolledCourses(userId) {
    try {
        if (!window.firebase || !window.firebase.db) {
            return [];
        }

        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userDocRef = doc(window.firebase.db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            return [];
        }

        const userData = userDoc.data();
        return userData.enrolledCourses || [];
    } catch (error) {
        console.error('Error getting enrolled courses:', error);
        return [];
    }
}

/**
 * Fetch user progress for the course
 */
async function fetchUserProgress(userId, courseId) {
    try {
        if (!window.firebase || !window.firebase.db) {
            return null;
        }

        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userDocRef = doc(window.firebase.db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            return null;
        }

        const userData = userDoc.data();
        const progress = userData.progress || {};
        
        return progress[courseId] || 0;
    } catch (error) {
        console.error('Error fetching user progress:', error);
        return 0;
    }
}

/**
 * Calculate progress percentage and stats
 */
function calculateProgressStats(lessons, completedLessons) {
    const totalLessons = lessons ? lessons.length : 0;
    const completed = completedLessons || 0;
    const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    
    return {
        total: totalLessons,
        completed: completed,
        percentage: percentage
    };
}

/**
 * Format duration from minutes to readable format
 */
function formatDuration(minutes) {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Update page title (both page element and document title for browser tab)
 */
function updatePageTitle(courseTitle) {
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle && courseTitle) {
        pageTitle.textContent = courseTitle;
    }
    // CRITICAL: Also update document.title immediately for browser tab
    if (courseTitle) {
        document.title = `${courseTitle} - Nuerlo`;
    }
}

/**
 * Populate overview section
 */
function populateOverview(courseData, progressData) {
    // Update progress
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${progressData.percentage || 0}%`;
    }

    const progressPercent = document.getElementById('progressPercent');
    if (progressPercent) {
        progressPercent.textContent = `${progressData.percentage || 0}%`;
    }

    const lessons = courseData.lessons || courseData.modules || [];
    const completedCount = progressData.completed || 0;

    // Populate continue learning
    populateContinueLearning(lessons, completedCount);

    // Populate recent lessons
    populateRecentLessons(lessons, completedCount);

    // Populate community preview
    populateCommunityPreview();
}

/**
 * Populate continue learning card
 */
function populateContinueLearning(lessons, completedCount) {
    const continueCard = document.getElementById('continueLearningCard');
    const continueNumber = document.getElementById('continueLearningNumber');
    const continueTitle = document.getElementById('continueLearningTitle');
    const continueDuration = document.getElementById('continueLearningDuration');

    if (!lessons || lessons.length === 0) {
        if (continueTitle) continueTitle.textContent = 'No lessons available';
        if (continueDuration) continueDuration.textContent = '-';
        return;
    }

    // Find next lesson to continue
    const nextLessonIndex = completedCount;
    const nextLesson = lessons[nextLessonIndex];

    if (!nextLesson) {
        // All lessons completed
        if (continueTitle) continueTitle.textContent = 'Course Complete!';
        if (continueNumber) continueNumber.textContent = '';
        if (continueDuration) continueDuration.textContent = '';
        return;
    }

    const duration = nextLesson.duration || nextLesson.durationMinutes || 0;
    const durationText = formatDuration(duration);

    if (continueNumber) continueNumber.textContent = nextLessonIndex + 1;
    if (continueTitle) continueTitle.textContent = nextLesson.title || nextLesson.name || `Lesson ${nextLessonIndex + 1}`;
    if (continueDuration) continueDuration.textContent = durationText;

        // Add click handler (only once)
        if (continueCard && !continueCard.hasAttribute('data-click-handler')) {
            continueCard.setAttribute('data-click-handler', 'true');
            continueCard.addEventListener('click', () => {
                if (typeof window.navigateToSection === 'function') {
                    window.navigateToSection('lessons');
                } else if (typeof navigateToSection === 'function') {
                    navigateToSection('lessons');
                }
            });
        }
}

/**
 * Populate recent lessons list
 */
function populateRecentLessons(lessons, completedCount) {
    const recentList = document.getElementById('recentLessonsList');
    if (!recentList || !lessons || !Array.isArray(lessons)) {
        return;
    }

    // Clear existing
    recentList.innerHTML = '';

    // Show last 3-5 completed lessons + next few upcoming lessons
    const maxRecent = 5;
    const startIndex = Math.max(0, completedCount - 3);
    const endIndex = Math.min(lessons.length, startIndex + maxRecent);

    if (endIndex <= startIndex) {
        // No lessons to show
        return;
    }

    for (let i = startIndex; i < endIndex; i++) {
        const lesson = lessons[i];
        const isCompleted = i < completedCount;
        const isNext = i === completedCount;

        const duration = lesson.duration || lesson.durationMinutes || 0;
        const durationText = formatDuration(duration);

        const lessonItem = document.createElement('div');
        lessonItem.className = 'recent-lesson-item';
        
        if (isCompleted) {
            lessonItem.classList.add('completed');
        }

        const checkmarkSvg = isCompleted ? `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        ` : '';

        lessonItem.innerHTML = `
            <div class="recent-lesson-number">${i + 1}</div>
            <div class="recent-lesson-content">
                <div class="recent-lesson-title">${lesson.title || lesson.name || `Lesson ${i + 1}`}</div>
                <div class="recent-lesson-meta">
                    <span class="lesson-duration">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${durationText}
                    </span>
                </div>
            </div>
            ${isCompleted ? `<div class="recent-lesson-status">${checkmarkSvg}</div>` : ''}
        `;

        // Add click handler
        lessonItem.addEventListener('click', () => {
            if (typeof window.navigateToSection === 'function') {
                window.navigateToSection('lessons');
            } else if (typeof navigateToSection === 'function') {
                navigateToSection('lessons');
            }
        });

        recentList.appendChild(lessonItem);
    }
}

/**
 * Populate community messages preview
 */
function populateCommunityPreview() {
    const communityMessagesList = document.getElementById('communityMessagesList');
    if (!communityMessagesList) {
        return;
    }

    // Sample community messages (in production, fetch from Firebase)
    const sampleMessages = [
        { text: 'Just finished lesson 3! The video explanation was really clear.', avatar: 'AC' },
        { text: 'Can anyone help me understand the concept from lesson 2?', avatar: 'SJ' },
        { text: 'Great course so far! The mentor explains everything step by step.', avatar: 'MR' }
    ];

    communityMessagesList.innerHTML = '';

    sampleMessages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'community-message-item';
        messageDiv.innerHTML = `
            <div class="community-avatar">${message.avatar}</div>
            <div class="community-message-content">
                <div class="community-message-text">${message.text}</div>
            </div>
        `;
        communityMessagesList.appendChild(messageDiv);
    });

    // Setup dropdown toggle
    const communityToggle = document.getElementById('communityToggle');
    const communityContent = document.getElementById('communityContent');
    
    if (communityToggle && communityContent) {
        communityToggle.addEventListener('click', () => {
            const isExpanded = communityContent.classList.contains('expanded');
            if (isExpanded) {
                communityContent.classList.remove('expanded');
                communityToggle.classList.remove('expanded');
            } else {
                communityContent.classList.add('expanded');
                communityToggle.classList.add('expanded');
            }
        });
    }
}

/**
 * Populate lessons section
 * 
 * HOW IT WORKS FOR DIFFERENT COURSE IDs:
 * - This is a TEMPLATE function - it works for ALL courses
 * - course.html is a single template file used by all courses
 * - Each course ID in Firebase has its own data (lessons, modules, videos)
 * - When a user visits /course/{courseId}, course.js:
 *   1. Extracts the courseId from the URL
 *   2. Fetches that specific course's data from Firebase
 *   3. Calls populateLessons() with that course's lessons
 *   4. Each course can have completely different lesson names, modules, and videos
 * 
 * TO ADD A NEW COURSE:
 * - Just add a new document in Firebase 'courses' collection with a unique ID
 * - Structure: { title, lessons: [{ title, duration, modules: [{ title, videos: [...] }] }] }
 * - Users can access it via /course/{courseId}
 * - No need to modify course.html or course.js - it's all dynamic!
 */
function populateLessons(lessons) {
    const lessonList = document.querySelector('#lessons .lesson-list');
    if (!lessonList) {
        return;
    }

    // If no lessons data, keep the sample boxes that are already in HTML
    if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
        return;
    }

    // Clear existing lessons only if we have data to populate
    lessonList.innerHTML = '';

    // Limit to a few lessons for display
    const displayLessons = lessons.slice(0, 5);

    displayLessons.forEach((lesson, index) => {
        const lessonBox = document.createElement('div');
        lessonBox.className = 'lesson-box';
        
        // Check if lesson is completed (you can enhance this with user progress data)
        const isCompleted = false; // TODO: Check against user progress
        
        if (isCompleted) {
            lessonBox.classList.add('completed');
        }

        const duration = lesson.duration || lesson.durationMinutes || 0;
        const durationText = formatDuration(duration);

        // Use modules from lesson data if available, otherwise create generic fallback
        // Each course in Firebase can have different modules and videos - this template works for all courses
        const modules = lesson.modules || [
            {
                title: lesson.module1Title || 'Module One',
                videos: lesson.module1Videos || [
                    { title: 'Video One', duration: 10 },
                    { title: 'Video Two', duration: 8 }
                ]
            },
            {
                title: lesson.module2Title || 'Module Two',
                videos: lesson.module2Videos || [
                    { title: 'Video Three', duration: 12 }
                ]
            }
        ];

        // Build modules HTML
        let modulesHTML = '';
        modules.forEach((module, moduleIndex) => {
            const videosHTML = module.videos.map((video, videoIndex) => `
                <div class="lesson-video-item">
                    <div class="lesson-video-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>
                    <div class="lesson-video-info">
                        <div class="lesson-video-title">${video.title}</div>
                        <div class="lesson-video-duration">${video.duration} min</div>
                    </div>
                </div>
            `).join('');

            modulesHTML += `
                <div class="lesson-module">
                    <div class="lesson-module-header">
                        <div class="lesson-module-title">${module.title}</div>
                        <div class="lesson-module-toggle">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div class="lesson-module-content">
                        <div class="lesson-videos">
                            ${videosHTML}
                        </div>
                    </div>
                </div>
            `;
        });

        lessonBox.innerHTML = `
            <div class="lesson-box-header">
                <div class="lesson-box-main">
                    <div class="lesson-box-number">${index + 1}</div>
                    <div class="lesson-box-info">
                        <div class="lesson-box-title">${lesson.title || lesson.name || `Lesson ${index + 1}`}</div>
                        <div class="lesson-box-meta">
                            <span class="lesson-duration">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                ${durationText}
                            </span>
                            <span>•</span>
                            <span>${modules.length} modules</span>
                        </div>
                    </div>
                </div>
                <div class="lesson-box-toggle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            <div class="lesson-box-content">
                <div class="lesson-modules">
                    ${modulesHTML}
                </div>
            </div>
        `;

        // Add click handler for lesson box toggle
        const lessonBoxHeader = lessonBox.querySelector('.lesson-box-header');
        lessonBoxHeader.addEventListener('click', (e) => {
            // Don't toggle if clicking on the toggle icon (let it handle it)
            if (e.target.closest('.lesson-box-toggle')) {
                lessonBox.classList.toggle('expanded');
            } else {
                lessonBox.classList.toggle('expanded');
            }
        });

        // Add click handlers for module toggles
        const moduleHeaders = lessonBox.querySelectorAll('.lesson-module-header');
        moduleHeaders.forEach((moduleHeader) => {
            moduleHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                const module = moduleHeader.closest('.lesson-module');
                module.classList.toggle('expanded');
            });
        });

        // Add click handlers for video items
        const videoItems = lessonBox.querySelectorAll('.lesson-video-item');
        videoItems.forEach((videoItem) => {
            videoItem.addEventListener('click', (e) => {
                e.stopPropagation();
                const videoTitle = videoItem.querySelector('.lesson-video-title').textContent;
                console.log('Navigate to video:', videoTitle);
                // TODO: Navigate to video player
            });
        });

        lessonList.appendChild(lessonBox);
    });
}

/**
 * Populate resources section
 */
function populateResources(resources) {
    const resourceList = document.querySelector('#resources .lesson-list');
    if (!resourceList) {
        return;
    }

    // If no resources data, keep the sample items that are already in HTML
    if (!resources || !Array.isArray(resources) || resources.length === 0) {
        return;
    }

    // Clear existing resources only if we have data to populate
    resourceList.innerHTML = '';

    resources.forEach((resource) => {
        const resourceItem = document.createElement('div');
        resourceItem.className = 'resource-item';
        
        // For external tools, show "Link" instead of file size
        const displayText = resource.size ? `${resource.size} MB` : 'Link';

        resourceItem.innerHTML = `
            <div class="resource-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </div>
            <div class="resource-name">${resource.name || resource.title || 'External Tool'}</div>
            <div class="resource-size">${displayText}</div>
        `;

        // Add click handler to open external link
        resourceItem.addEventListener('click', () => {
            if (resource.url) {
                window.open(resource.url, '_blank');
            }
        });

        resourceList.appendChild(resourceItem);
    });
}

/**
 * Populate assignments section
 */
function populateAssignments(assignments) {
    const assignmentList = document.querySelector('#assignments .lesson-list');
    if (!assignmentList) {
        return;
    }

    // Clear existing assignments
    assignmentList.innerHTML = '';

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
        return;
    }

    assignments.forEach((assignment, index) => {
        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'lesson-item';
        
        const isCompleted = assignment.completed || false;
        if (isCompleted) {
            assignmentItem.classList.add('completed');
        }

        const dueDate = assignment.dueDate ? new Date(assignment.dueDate.toDate ? assignment.dueDate.toDate() : assignment.dueDate) : null;
        const dueDateText = dueDate ? formatDueDate(dueDate) : 'No due date';

        // Format due date text more concisely
        let dueText = dueDateText;
        if (dueText.includes('days ago')) {
            const days = dueText.match(/\d+/);
            dueText = days ? `${days[0]}d ago` : dueText;
        } else if (dueText.includes('In') && dueText.includes('days')) {
            const days = dueText.match(/\d+/);
            dueText = days ? `${days[0]}d` : dueText;
        }

        assignmentItem.innerHTML = `
            <div class="lesson-number">${index + 1}</div>
            <div class="lesson-content">
                <div class="lesson-title">${assignment.title || assignment.name || `Assignment ${index + 1}`}</div>
                <div class="lesson-meta">
                    <span>${dueText}</span>
                    <span>•</span>
                    <span>${isCompleted ? 'Submitted' : 'Not started'}</span>
                </div>
            </div>
        `;

        assignmentList.appendChild(assignmentItem);
    });
}

/**
 * Format due date
 */
function formatDueDate(date) {
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Tomorrow';
    } else {
        return `In ${diffDays} days`;
    }
}

/**
 * Populate progress section - Match Dashboard Style
 */
function populateProgress(courseData, progressData) {
    const progressSection = document.querySelector('#progress');
    if (!progressSection) {
        return;
    }

    // Update stats to match dashboard
    const progressStudyTime = document.getElementById('progressStudyTime');
    const progressCompleted = document.getElementById('progressCompleted');
    const progressStreak = document.getElementById('progressStreak');
    const progressAverage = document.getElementById('progressAverage');
    
    // Study time (estimated based on completed lessons)
    if (progressStudyTime) {
        const estimatedHours = Math.floor((progressData.completed || 0) * 0.5);
        progressStudyTime.textContent = estimatedHours > 0 ? `${estimatedHours}h` : '—';
    }
    
    // Completed lessons
    if (progressCompleted) {
        progressCompleted.textContent = `${progressData.completed || 0} / ${progressData.total || 0}`;
    }
    
    // Streak (can be enhanced with actual streak data from Firebase)
    if (progressStreak) {
        progressStreak.textContent = '3 days';
    }
    
    // Average progress
    if (progressAverage) {
        progressAverage.textContent = `${progressData.percentage || 0}%`;
    }

    // Draw progress chart
    drawProgressChart(progressData);
}

/**
 * Draw progress line chart - Match Dashboard Style
 */
function drawProgressChart(progressData) {
    const chartLine = document.getElementById('chartLine');
    const chartArea = document.getElementById('chartArea');
    const chartPoints = document.getElementById('chartPoints');
    
    if (!chartLine || !chartArea || !chartPoints) {
        return;
    }

    // Generate progress data over last 7 days
    const days = 7;
    const dataPoints = [];
    const currentProgress = progressData.percentage || 0;
    
    // Create data points showing progress over time
    for (let i = 0; i < days; i++) {
        // Simulate gradual progress (in production, use actual historical data from Firebase)
        const dayProgress = Math.max(0, currentProgress - (days - i - 1) * (currentProgress / days));
        dataPoints.push(Math.min(100, dayProgress));
    }
    
    // Chart coordinates (matching dashboard SVG viewBox)
    const chartWidth = 630; // 700 - 70 (left padding)
    const chartHeight = 190; // 220 - 30 (top padding)
    const startX = 127; // First data point X
    const stepX = 95; // Distance between points
    const baseY = 220; // Bottom of chart
    const topY = 30; // Top of chart
    
    // Calculate Y positions (inverted because SVG Y increases downward)
    const points = dataPoints.map((progress, index) => {
        const x = startX + (index * stepX);
        const y = baseY - (progress / 100) * (baseY - topY);
        return { x, y, progress };
    });
    
    // Build polyline points string
    const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    chartLine.setAttribute('points', linePoints);
    
    // Build area polygon (fill under line)
    const areaPoints = [
        `${points[0].x},${baseY}`, // Start at bottom left
        ...points.map(p => `${p.x},${p.y}`), // Follow the line
        `${points[points.length - 1].x},${baseY}` // End at bottom right
    ].join(' ');
    chartArea.setAttribute('points', areaPoints);
    
    // Add data points
    chartPoints.innerHTML = '';
    points.forEach((point) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'chart-point');
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
        chartPoints.appendChild(circle);
    });
}

/**
 * Main initialization function
 */
async function initializeCourseView() {
    try {
        // CRITICAL: Set document title immediately (before any async operations)
        // This ensures the browser tab shows the course name right away
        const courseId = extractCourseIdFromUrl();
        if (courseId) {
            // Set a default title immediately - will be updated with actual course name later
            document.title = `Course - Nuerlo`;
        }
        
        // Wait for Firebase to be ready first (needed for auth check)
        let firebaseReady = false;
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait

        while (!firebaseReady && attempts < maxAttempts) {
            if (window.firebase && window.firebase.auth && window.firebase.db) {
                firebaseReady = true;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!firebaseReady) {
            console.error('Firebase not initialized');
            window.location.href = '/dashboard.html';
            return;
        }

        // Verify authentication and get user
        const user = await verifyAuthentication();
        if (!user) {
            console.error('User not authenticated - redirecting to login');
            window.location.href = '/index.html';
            return;
        }
        
        console.log('User authenticated:', user.uid, user.email);
        
        // Store user info globally for debugging
        window.currentUserId = user.uid;
        window.currentUserEmail = user.email;

        // Extract course ID from sessionStorage or URL
        courseId = extractCourseIdFromUrl();
        
        // CRITICAL: If we got courseId from sessionStorage, make sure it's stored back (in case it was cleared)
        // This ensures it persists across refreshes
        if (courseId && courseId !== 'placeholder') {
            sessionStorage.setItem('currentCourseId', courseId);
            console.log('Stored courseId in sessionStorage for persistence:', courseId);
        }
        
        // If no course ID in URL, try to get first enrolled course (for live mode/development)
        if (!courseId) {
            const isCoursePage = window.location.pathname.includes('/course/') || 
                                window.location.pathname.includes('course.html');
            
            if (isCoursePage) {
                console.log('No course ID in URL - attempting to use first enrolled course for live mode');
                
                // Get user's enrolled courses
                const enrolledCourses = await getEnrolledCourses(user.uid);
                
                if (enrolledCourses && enrolledCourses.length > 0) {
                    // Use the first enrolled course
                    courseId = enrolledCourses[0];
                    console.log('Using first enrolled course for live mode:', courseId);
                } else {
                    // No enrolled courses - try to find any course in the database as fallback
                    console.log('No enrolled courses found - attempting to find any course as fallback');
                    try {
                        const { collection, getDocs, query, limit } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                        const coursesRef = collection(window.firebase.db, 'courses');
                        const coursesQuery = query(coursesRef, limit(1));
                        const coursesSnapshot = await getDocs(coursesQuery);
                        
                        if (!coursesSnapshot.empty) {
                            courseId = coursesSnapshot.docs[0].id;
                            console.log('Using fallback course for live mode:', courseId);
                        } else {
                            console.warn('No courses found in database - showing course view with placeholder data');
                            // Will continue with courseId = null, which will show placeholder content
                        }
                    } catch (fallbackError) {
                        console.error('Error finding fallback course:', fallbackError);
                        // Continue with courseId = null to show placeholder content
                    }
                }
            } else {
                // Not on a course page, don't initialize
                return;
            }
        }

        // If still no course ID, show placeholder content (for live mode without any courses)
        if (!courseId) {
            console.log('No course ID available - showing course view with placeholder data for live mode');
            
            // Create placeholder course data
            const placeholderCourseData = {
                id: 'placeholder',
                title: 'AI Course',
                name: 'AI Course',
                lessons: [
                    { title: 'Introduction to the Course', duration: 15 },
                    { title: 'Getting Started', duration: 20 },
                    { title: 'Core Concepts', duration: 30 },
                    { title: 'Advanced Techniques', duration: 25 },
                    { title: 'Practical Applications', duration: 35 }
                ],
                resources: [],
                assignments: [],
                duration: '8h'
            };
            
            currentCourseData = placeholderCourseData;
            
            // Calculate placeholder progress
            const progressStats = calculateProgressStats(placeholderCourseData.lessons, 5);
            
            // Populate all sections with placeholder data
            console.log('Populating course content with placeholder data...');
            updatePageTitle(placeholderCourseData.title);
            populateOverview(placeholderCourseData, progressStats);
            populateLessons(placeholderCourseData.lessons);
            populateResources(placeholderCourseData.resources);
            populateAssignments(placeholderCourseData.assignments);
            populateProgress(placeholderCourseData, progressStats);
            
            // Store enrollment info globally
            window.currentUserEnrolledCourses = await getEnrolledCourses(user.uid);
            console.log('User enrolled courses:', window.currentUserEnrolledCourses);
            
            // Hide loading screen
            console.log('Hiding loading screen with fade animation...');
            hideLoadingScreen();
            console.log('Course view initialized with placeholder data for live mode!');
            
            // Store in window for global access
            window.currentCourseId = 'placeholder';
            window.currentCourseData = placeholderCourseData;
            
            return;
        }

        // Check enrollment
        console.log('Checking enrollment for course:', courseId);
        let isEnrolled = await checkEnrollment(user.uid, courseId);
        
        // If not enrolled, try to auto-enroll (safety measure)
        if (!isEnrolled) {
            console.warn('User not enrolled, attempting to auto-enroll...');
            try {
                const { doc, getDoc, updateDoc, arrayUnion, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const userRef = doc(window.firebase.db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    // Add course to enrolledCourses
                    await updateDoc(userRef, {
                        enrolledCourses: arrayUnion(courseId)
                    });
                    console.log('Auto-enrolled user in course:', courseId);
                    
                    // Also update course document
                    const courseRef = doc(window.firebase.db, 'courses', courseId);
                    const courseDoc = await getDoc(courseRef);
                    if (courseDoc.exists()) {
                        await updateDoc(courseRef, {
                            enrolled: arrayUnion(user.uid),
                            students: (courseDoc.data().students || 0) + 1
                        });
                    }
                    
                    isEnrolled = true;
                } else {
                    // Create user document with enrollment
                    await setDoc(userRef, {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || user.email?.split('@')[0] || 'User',
                        enrolledCourses: [courseId],
                        progress: {},
                        role: 'user', // Default role for all new users
                        createdAt: new Date()
                    });
                    console.log('Created user document with course enrollment:', courseId);
                    isEnrolled = true;
                }
            } catch (enrollError) {
                console.error('Error auto-enrolling:', enrollError);
            }
        }
        
        if (!isEnrolled) {
            console.error('User not enrolled in course:', courseId);
            console.error('User ID:', user.uid);
            console.error('Course ID:', courseId);
            
            // Show error message before redirecting
            alert(`You are not enrolled in this course. Please enroll from the dashboard first.`);
            window.location.href = '/dashboard.html';
            return;
        }
        
        console.log('User is enrolled in course:', courseId);
        
        // Store enrollment info globally
        window.currentUserEnrolledCourses = await getEnrolledCourses(user.uid);
        console.log('User enrolled courses:', window.currentUserEnrolledCourses);

        // Fetch course data
        const courseData = await fetchCourseData(courseId);
        currentCourseData = courseData;

        // CRITICAL: Update document title IMMEDIATELY after fetching course data
        // This ensures the browser tab shows the course name right away
        updatePageTitle(courseData.title || courseData.name || 'Course');
        console.log('Document title updated to:', document.title);

        // Fetch user progress
        const userProgress = await fetchUserProgress(user.uid, courseId);
        
        // Calculate progress stats
        const lessons = courseData.lessons || courseData.modules || [];
        const completedLessons = Math.floor((userProgress / 100) * lessons.length);
        const progressStats = calculateProgressStats(lessons, completedLessons);

        // Populate all sections
        console.log('Populating course content...');
        populateOverview(courseData, progressStats);
        populateLessons(lessons);
        populateResources(courseData.resources || []);
        populateAssignments(courseData.assignments || []);
        populateProgress(courseData, progressStats);
        
        console.log('All course content populated');

        // NOW hide loading screen with fade animation (matches dashboard behavior)
        // This happens AFTER Firebase auth, enrollment check, and all data is loaded
        console.log('Hiding loading screen with fade animation...');
        hideLoadingScreen();
        console.log('Course view initialization complete!');

        // Store course ID in multiple places for debugging and accessibility
        const body = document.body;
        if (body) {
            body.setAttribute('data-course-id', courseId);
        }
        
        // Store in meta tag
        const courseIdMeta = document.getElementById('courseIdMeta');
        if (courseIdMeta) {
            courseIdMeta.setAttribute('content', courseId);
        }
        
        // Store in window for global access
        window.currentCourseId = courseId;
        window.currentCourseData = courseData;
        
        // CRITICAL: Store in sessionStorage for CourseRouter to detect course context
        sessionStorage.setItem('currentCourseId', courseId);

        console.log('Course view initialized successfully:', courseData);
        
        // Log course access activity
        if (window.logUserActivity) {
            await window.logUserActivity('course_access', { courseId: courseId });
            console.log('Course access logged');
        }
        
        // Start study time tracking
        startStudyTimeTracking(courseId);

    } catch (error) {
        console.error('Error initializing course view:', error);
        console.error('Course ID was:', courseId);
        console.error('Error details:', error.message, error.stack);
        
        // Show content anyway with error message
        const body = document.body;
        if (body) {
            body.setAttribute('data-course-id', courseId || 'error');
            body.setAttribute('data-error', error.message || 'Unknown error');
        }
        
        // Hide loading screen even on error (so user sees something)
        hideLoadingScreen();
        
        // Only redirect if it's a critical error
        if (error.message && error.message.includes('not found')) {
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
        }
    }
}

// ============================================
// STUDY TIME TRACKING & LESSON COMPLETION
// ============================================

let studyStartTime = null;
let studyTimer = null;

// Mark a lesson as completed and log activity
async function markLessonComplete(lessonId, courseId) {
    try {
        if (window.logUserActivity) {
            await window.logUserActivity('lesson_complete', {
                courseId: courseId || window.currentCourseId,
                lessonId: lessonId
            });
            console.log('Lesson completion logged:', lessonId);
        }
        
        // Update lesson UI to show completion
        const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
        if (lessonElement) {
            lessonElement.classList.add('completed');
        }
    } catch (error) {
        console.error('Error marking lesson complete:', error);
    }
}

// Export function for global use
window.markLessonComplete = markLessonComplete;

// Start tracking study time for the current course session
function startStudyTimeTracking(courseId) {
    studyStartTime = Date.now();
    console.log('⏱ Started study time tracking for course:', courseId);
    
    // Log study time every 5 minutes
    if (studyTimer) {
        clearInterval(studyTimer);
    }
    
    studyTimer = setInterval(async () => {
        if (window.logUserActivity && studyStartTime) {
            const minutesStudied = Math.floor((Date.now() - studyStartTime) / 60000);
            if (minutesStudied > 0) {
                await window.logUserActivity('study_time', { 
                    courseId: courseId, 
                    minutes: 5 // Log 5 minutes at a time
                });
                console.log('⏱ Logged 5 minutes of study time');
            }
        }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Also log when page is closed/navigated away
    window.addEventListener('beforeunload', () => {
        if (window.logUserActivity && studyStartTime) {
            const minutesStudied = Math.floor((Date.now() - studyStartTime) / 60000);
            if (minutesStudied > 0) {
                // Use synchronous approach for beforeunload
                navigator.sendBeacon('/log-activity', JSON.stringify({
                    type: 'study_time',
                    courseId: courseId,
                    minutes: minutesStudied % 5 // Log remaining minutes not already logged
                }));
            }
        }
    });
}

// Only initialize on course pages, not dashboard
// Check if we're on a course page by looking for course ID in URL
function shouldInitializeCourseView() {
    // Check URL pathname for /course/ pattern
    const pathname = window.location.pathname;
    const hasCourseInPath = pathname.includes('/course/') && pathname.split('/course/').length > 1;
    
    // Also check if we're on course.html (not dashboard.html)
    const isCourseHtml = pathname.includes('course.html') || 
                         (document.querySelector && document.querySelector('body.dashboard-body #overview'));
    
    return hasCourseInPath || isCourseHtml;
}

// Only initialize if we're actually on a course page
if (shouldInitializeCourseView()) {
    // DO NOT show content early - wait for Firebase auth and course data
    // Loading screen will stay visible until initializeCourseView() calls hideLoadingScreen()
    
    // Initialize when DOM is ready and Firebase is available
    // The initializeCourseView function has its own Firebase waiting logic
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                initializeCourseView().catch(err => {
                    console.error('Course initialization failed:', err);
                    // Hide loading screen even on error
                    if (typeof hideLoadingScreen === 'function') {
                        hideLoadingScreen();
                    }
                });
            }, 100);
        });
    } else {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            initializeCourseView().catch(err => {
                console.error('Course initialization failed:', err);
                // Hide loading screen even on error
                if (typeof hideLoadingScreen === 'function') {
                    hideLoadingScreen();
                }
            });
        }, 100);
    }
} else {
    // Not on course page - don't initialize (prevents errors on dashboard)
    // Silently skip - no console log to avoid noise
}

// Loading Screen Functions (matches dashboard behavior)
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const protectedContent = document.getElementById('authProtectedContent');
    
    // Show the authenticated content ONLY when hiding the loading screen
    if (protectedContent) {
        protectedContent.style.display = 'block';
        document.body.classList.add('auth-ready');
        console.log('Showing authenticated content');
    }
    
    // Hide the loading screen with fade animation
    if (loadingScreen) {
        // Add 'hidden' class to trigger fade-out animation
        loadingScreen.classList.add('hidden');
        console.log('Hiding loading screen with fade animation');
        
        // Remove from DOM after animation completes (0.5s)
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const protectedContent = document.getElementById('authProtectedContent');
    
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
        loadingScreen.style.display = 'flex';
    }
    
    if (protectedContent) {
        protectedContent.style.display = 'none';
        document.body.classList.remove('auth-ready');
    }
}

// Export for global access if needed
window.initializeCourseView = initializeCourseView;
window.hideLoadingScreen = hideLoadingScreen;
window.showLoadingScreen = showLoadingScreen;

