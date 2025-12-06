// Progress Tracking Module
// Handles all progress data loading, course selection, and chart rendering

let enrolledCoursesData = [];
let currentSelectedCourse = null;

async function loadProgressData() {
    try {
        // Check if Firebase is properly initialized
        if (!window.firebase || !window.firebase.auth || !window.firebase.db) {
            console.warn('Firebase not properly initialized');
            return;
        }
        
        const auth = window.firebase.auth;
        const db = window.firebase.db;
        
        // Check if Firestore functions are available
        if (!window.firestoreFunctions || !window.firestoreFunctions.doc || !window.firestoreFunctions.getDoc) {
            console.warn('Firestore functions not available');
            return;
        }
        
        const { doc, getDoc } = window.firestoreFunctions;
        const user = auth.currentUser;
        
        if (!user) {
            console.log('No user authenticated');
            return;
        }
        
        // Verify user token is still valid
        try {
            await user.getIdToken(true); // Force refresh to check validity
        } catch (tokenError) {
            console.warn('User token invalid or expired:', tokenError.message);
            return;
        }
        
        // Get user document to find enrolled courses
        let userDoc;
        try {
            const userRef = doc(db, 'users', user.uid);
            userDoc = await getDoc(userRef);
        } catch (firestoreError) {
            // Handle Firestore connection errors (400, network errors, etc.)
            if (firestoreError.code === 'unavailable' || 
                firestoreError.message?.includes('Failed to get document') ||
                firestoreError.message?.includes('400') ||
                firestoreError.message?.includes('Bad Request')) {
                console.warn('Firestore connection error, will retry later:', firestoreError.message);
                return;
            }
            // Re-throw if it's a different error
            throw firestoreError;
        }
        
        let totalCourses = 0;
        let completedCourses = 0;
        let totalTime = 0;
        let lastActiveDate = null;
        
        enrolledCoursesData = [];
        const activityHTML = [];
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('[LOAD] User document found, userData:', userData);
            
            // ONLY get course IDs from enrolledCourses array (currently enrolled courses)
            const enrolledCourseIds = userData.enrolledCourses || [];
            
            console.log('[LOAD] Currently enrolled course IDs:', enrolledCourseIds);
            
            if (enrolledCourseIds.length === 0) {
                console.warn('[LOAD] ⚠️ No currently enrolled courses found! User might need to enroll in courses.');
            }
            
            // Fetch each course from the courses collection
            for (const courseId of enrolledCourseIds) {
                console.log('Fetching course:', courseId);
                try {
                    const courseRef = doc(db, 'courses', courseId);
                    let courseDoc;
                    try {
                        courseDoc = await getDoc(courseRef);
                    } catch (courseError) {
                        // Handle Firestore connection errors for individual courses
                        if (courseError.code === 'unavailable' || 
                            courseError.message?.includes('Failed to get document') ||
                            courseError.message?.includes('400') ||
                            courseError.message?.includes('Bad Request')) {
                            console.warn(`Skipping course ${courseId} due to Firestore connection error`);
                            continue;
                        }
                        throw courseError;
                    }
                    
                    if (courseDoc.exists()) {
                        const courseData = courseDoc.data();
                        courseData.id = courseDoc.id;
                        console.log('Course found:', courseData.title || courseData.name);
                        
                        // Get user's progress for this course from BOTH courseProgress and progress maps
                        const userProgress = userData.courseProgress?.[courseId] || {};
                        
                        // Get progress from courseProgress first, then fall back to progress map
                        let progressValue = userProgress.progress;
                        if (progressValue === undefined || progressValue === null) {
                            // Try getting from the simple progress map
                            progressValue = userData.progress?.[courseId];
                        }
                        
                        console.log(`[LOAD] Raw userProgress for ${courseId}:`, userProgress);
                        console.log(`[LOAD] Progress from courseProgress:`, userProgress.progress);
                        console.log(`[LOAD] Progress from progress map:`, userData.progress?.[courseId]);
                        console.log(`[LOAD] Final progress value type:`, typeof progressValue, 'Value:', progressValue);
                        
                        // Use real Firebase data for this specific course
                        // Ensure progress is a number
                        courseData.progress = typeof progressValue === 'number' ? progressValue : (parseFloat(progressValue) || 0);
                        courseData.timeSpent = userProgress.timeSpent || 0;
                        courseData.modulesCompleted = userProgress.modulesCompleted || 0;
                        courseData.sectionsCompleted = userProgress.sectionsCompleted || 0;
                        courseData.lastAccessed = userProgress.lastAccessed || null;
                        courseData.completed = userProgress.completed || false;
                        courseData.progressHistory = userProgress.progressHistory || null;
                        courseData.startedAt = userProgress.startedAt || null;
                        
                        console.log(`[LOAD] Course "${courseData.title}":`, {
                            progress: courseData.progress,
                            progressType: typeof courseData.progress,
                            timeSpent: courseData.timeSpent,
                            modulesCompleted: courseData.modulesCompleted,
                            lastAccessed: courseData.lastAccessed,
                            startedAt: courseData.startedAt
                        });
                        
                        enrolledCoursesData.push(courseData);
                        totalCourses++;
                        
                        console.log('[LOAD] ✅ Added course to enrolledCoursesData:', courseData.title, 'Progress:', courseData.progress);
                        
                        // Calculate stats
                        if (courseData.completed) {
                            completedCourses++;
                        }
                        
                        if (courseData.timeSpent) {
                            totalTime += courseData.timeSpent || 0;
                        }
                        
                        if (courseData.lastAccessed) {
                            const accessDate = courseData.lastAccessed.toDate ? courseData.lastAccessed.toDate() : new Date(courseData.lastAccessed);
                            if (!lastActiveDate || accessDate > lastActiveDate) {
                                lastActiveDate = accessDate;
                            }
                        }
                        
                        // Build activity entry
                        const courseName = courseData.title || courseData.courseName || 'Untitled Course';
                        if (courseData.lastAccessed) {
                            const accessDate = courseData.lastAccessed.toDate ? courseData.lastAccessed.toDate() : new Date(courseData.lastAccessed);
                            const dateStr = formatDate(accessDate);
                            activityHTML.push(`
                                <div class="profile-field">
                                    <div class="profile-field-label">${courseName}</div>
                                    <div class="profile-field-value">
                                        <span style="color: var(--color-text-tertiary);">${dateStr}</span>
                                    </div>
                                </div>
                            `);
                        }
                    } else {
                        console.log('Course document not found for ID:', courseId);
                    }
                } catch (error) {
                    console.error(`Error loading course ${courseId}:`, error);
                }
            }
        } else {
            console.log('User document does not exist');
        }
        
        console.log('Final enrolled courses data:', enrolledCoursesData);
        console.log('Total courses loaded:', totalCourses);
        
        // Update stats
        const enrolledEl = document.getElementById('totalCoursesEnrolled');
        const completedEl = document.getElementById('totalCoursesCompleted');
        
        if (enrolledEl) enrolledEl.textContent = totalCourses;
        if (completedEl) completedEl.textContent = completedCourses;
        
        // Format time
        let timeText = '0 minutes';
        if (totalTime > 0) {
            if (totalTime >= 60) {
                const hours = Math.floor(totalTime / 60);
                const mins = totalTime % 60;
                timeText = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;
            } else {
                timeText = `${totalTime} minutes`;
            }
        }
        document.getElementById('totalLearningTime').textContent = timeText;
        
        // Calculate streak
        if (lastActiveDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            lastActiveDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                document.getElementById('currentStreak').textContent = '1 day';
            } else {
                document.getElementById('currentStreak').textContent = '0 days';
            }
            
            document.getElementById('lastActive').textContent = formatDate(lastActiveDate);
            document.getElementById('lastActive').style.color = 'var(--color-text-secondary)';
        } else {
            document.getElementById('currentStreak').textContent = '0 days';
        }
        
        // Populate main course selector
        console.log('About to populate course selector...');
        populateMainCourseSelector();
        
        // Update activity section
        const activityContent = document.getElementById('activityContent');
        if (activityContent) {
            if (activityHTML.length > 0) {
                activityContent.innerHTML = activityHTML.join('');
            } else {
                activityContent.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1rem;">
                        <h3 style="color: var(--color-text-primary); margin-bottom: 0.5rem; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">No recent activity</h3>
                        <p style="color: var(--color-text-tertiary); margin-bottom: 2rem; font-size: var(--font-size-sm);">Your learning activity will appear here</p>
                    </div>
                `;
            }
        }
        
        console.log('[LOAD] Progress data loading complete - Total enrolled courses:', enrolledCoursesData.length);
        
        // Populate continue learning section
        populateContinueLearning();
        
        // Render all programs after loading (only if we have courses)
        if (enrolledCoursesData.length > 0 && window.updateProgramsFilter) {
            console.log('[LOAD] Rendering programs with', enrolledCoursesData.length, 'courses');
            updateProgramsFilter('all');
        } else {
            console.log('[LOAD] No enrolled courses to render');
        }
        
    } catch (error) {
        // Handle Firestore connection errors gracefully
        if (error.code === 'unavailable' || 
            error.message?.includes('Failed to get document') ||
            error.message?.includes('400') ||
            error.message?.includes('Bad Request') ||
            error.message?.includes('Firestore')) {
            console.warn('Firestore connection error (likely network/auth issue):', error.message);
            // Don't log full error stack for connection issues
            return;
        }
        console.error('Error loading progress data:', error);
        console.error('Error stack:', error.stack);
    }
}

// Function to populate continue learning section
function populateContinueLearning() {
    console.log('[CONTINUE] Populating continue learning, enrolled courses:', enrolledCoursesData.length);
    
    const continueContainer = document.getElementById('continueCourse');
    const noCoursesMsg = document.getElementById('noCourses');
    
    if (!continueContainer || !noCoursesMsg) {
        console.error('[CONTINUE] Elements not found');
        return;
    }
    
    // If no enrolled courses at all, show marketplace message
    if (enrolledCoursesData.length === 0) {
        console.log('[CONTINUE] No enrolled courses, showing marketplace message');
        continueContainer.style.display = 'none';
        noCoursesMsg.style.display = 'block';
        return;
    }
    
    // Find most recently accessed course (prioritize in-progress, but show any enrolled course)
    const inProgressCourses = enrolledCoursesData.filter(course => {
        const progress = course.progress || 0;
        return progress > 0 && progress < 100;
    });
    
    console.log('[CONTINUE] In-progress courses:', inProgressCourses.length);
    
    let courseToShow;
    
    if (inProgressCourses.length > 0) {
        // Show most recently accessed in-progress course
        inProgressCourses.sort((a, b) => {
            const dateA = a.lastAccessed ? (a.lastAccessed.toDate ? a.lastAccessed.toDate() : new Date(a.lastAccessed)) : new Date(0);
            const dateB = b.lastAccessed ? (b.lastAccessed.toDate ? b.lastAccessed.toDate() : new Date(b.lastAccessed)) : new Date(0);
            return dateB - dateA;
        });
        courseToShow = inProgressCourses[0];
    } else {
        // No in-progress courses, show the first enrolled course (they can start it)
        courseToShow = enrolledCoursesData[0];
    }
    
    if (courseToShow) {
        const title = courseToShow.title || courseToShow.name || 'Untitled Course';
        const progress = courseToShow.progress || 0;
        const lessons = courseToShow.lessons || [];
        const lessonsCount = Array.isArray(lessons) ? lessons.length : (courseToShow.lessonsCount || 32);
        const image = courseToShow.image || courseToShow.imageURL || '';
        
        console.log('[CONTINUE] Showing course:', title, 'Progress:', progress + '%');
        
        // Update continue learning card
        const titleEl = document.getElementById('continueTitle');
        const metaEl = document.getElementById('continueMeta');
        const progressEl = document.getElementById('continueProgress');
        const progressBarEl = document.getElementById('continueProgressBar');
        const progressContainer = document.querySelector('#continueCourse .program-progress');
        const thumbnailImg = document.getElementById('continueThumbnailImg');
        const continueBtn = document.querySelector('#continueCourse .btn-primary');
        
        if (titleEl) titleEl.textContent = title;
        if (metaEl) metaEl.textContent = `${lessonsCount} lessons`;
        
        // Show/hide progress bar based on progress
        if (progress > 0) {
            if (progressEl) progressEl.textContent = `${progress}%`;
            if (progressBarEl) progressBarEl.style.width = `${progress}%`;
            if (progressContainer) progressContainer.style.display = 'block';
            if (continueBtn) continueBtn.textContent = 'Continue';
        } else {
            if (progressContainer) progressContainer.style.display = 'none';
            if (continueBtn) continueBtn.textContent = 'Start Course';
        }
        
        if (thumbnailImg && image) {
            thumbnailImg.src = image;
            thumbnailImg.style.display = 'block';
        } else if (thumbnailImg) {
            thumbnailImg.style.display = 'none';
        }
        
        // Store course ID for resumeCourse function
        window.currentContinueCourseId = courseToShow.id;
        
        // Show continue learning, hide no courses message
        continueContainer.style.display = 'block';
        noCoursesMsg.style.display = 'none';
    }
}

// Function to resume course
window.resumeCourse = function() {
    if (window.currentContinueCourseId) {
        window.location.href = `/course/${window.currentContinueCourseId}`;
    }
};

// Function to update programs filter and render courses
window.updateProgramsFilter = function(filterType) {
    console.log('[PROGRAMS] Updating programs filter:', filterType, 'Total enrolled courses:', enrolledCoursesData.length);
    
    // Safety check - don't try to render if data isn't loaded yet
    if (!Array.isArray(enrolledCoursesData)) {
        console.warn('[PROGRAMS] enrolledCoursesData not initialized yet, skipping render');
        return;
    }
    
    let targetGrid, loadingEl, emptyEl;
    
    // Determine which grid to populate
    if (filterType === 'all') {
        targetGrid = document.getElementById('programsGrid');
        loadingEl = document.getElementById('programsLoading');
        emptyEl = document.getElementById('noProgramsMessage');
    } else if (filterType === 'not-started') {
        targetGrid = document.getElementById('programsGridNotStarted');
        loadingEl = document.getElementById('programsLoadingNotStarted');
        emptyEl = document.getElementById('noProgramsMessageNotStarted');
    } else if (filterType === 'in-progress') {
        targetGrid = document.getElementById('programsGridInProgress');
        loadingEl = document.getElementById('programsLoadingInProgress');
        emptyEl = document.getElementById('noProgramsMessageInProgress');
    } else if (filterType === 'completed') {
        targetGrid = document.getElementById('programsGridCompleted');
        loadingEl = document.getElementById('programsLoadingCompleted');
        emptyEl = document.getElementById('noProgramsMessageCompleted');
    }
    
    if (!targetGrid) {
        console.error('[PROGRAMS] Target grid not found for filter:', filterType);
        return;
    }
    
    // Filter courses based on progress
    let filteredCourses = [];
    if (filterType === 'all') {
        filteredCourses = enrolledCoursesData;
    } else if (filterType === 'not-started') {
        filteredCourses = enrolledCoursesData.filter(course => (course.progress || 0) === 0);
    } else if (filterType === 'in-progress') {
        filteredCourses = enrolledCoursesData.filter(course => {
            const progress = course.progress || 0;
            console.log(`[PROGRAMS] Course "${course.title}" progress:`, progress, 'In progress?', progress > 0 && progress < 100);
            return progress > 0 && progress < 100;
        });
    } else if (filterType === 'completed') {
        filteredCourses = enrolledCoursesData.filter(course => (course.progress || 0) >= 100);
    }
    
    console.log('[PROGRAMS] Filtered courses:', filteredCourses.length, 'for filter:', filterType);
    filteredCourses.forEach(c => console.log(`  - ${c.title}: ${c.progress}%`));
    
    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    // Clear old cards (except loading and empty state)
    const oldCards = targetGrid.querySelectorAll('.program-card');
    oldCards.forEach(card => card.remove());
    
    // Show/hide empty state
    if (filteredCourses.length === 0) {
        console.log('[PROGRAMS] No courses to show, displaying empty state');
        if (emptyEl) emptyEl.style.display = 'block';
    } else {
        console.log('[PROGRAMS] Rendering', filteredCourses.length, 'course cards');
        if (emptyEl) emptyEl.style.display = 'none';
        
        // Render program cards
        filteredCourses.forEach(course => {
            const card = createProgramCard(course);
            targetGrid.appendChild(card);
        });
    }
};

// Function to create a program card
function createProgramCard(course) {
    const card = document.createElement('div');
    card.className = 'program-card';
    card.onclick = function() {
        window.location.href = `/course/${course.id}`;
    };
    
    const title = course.title || course.name || 'Untitled Course';
    const progress = course.progress || 0;
    const lessons = course.lessons || [];
    const lessonsCount = Array.isArray(lessons) ? lessons.length : (course.lessonsCount || 32);
    const image = course.image || course.imageURL || '';
    
    card.innerHTML = `
        <div class="program-thumbnail">
            ${image ? `<img src="${image}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
        </div>
        <div class="program-content">
            <div class="program-header">
                <h4 class="program-title">${title}</h4>
                <div class="program-meta">
                    <span>${lessonsCount} lessons</span>
                </div>
            </div>
            ${progress > 0 ? `
            <div class="program-progress">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            ` : ''}
            <button class="btn btn-primary" onclick="event.stopPropagation(); window.location.href='/course/${course.id}'">
                ${progress > 0 ? 'Continue' : 'Start Course'}
            </button>
        </div>
    `;
    
    return card;
}

function populateMainCourseSelector() {
    const dropdownOptions = document.getElementById('dropdownOptions');
    const noCoursesMsg = document.getElementById('noCoursesMessage');
    if (!dropdownOptions) return;
    
    dropdownOptions.innerHTML = '';
    
    console.log('Populating dropdown with courses:', enrolledCoursesData.length);
    
    if (enrolledCoursesData.length === 0) {
        // Show no courses message
        if (noCoursesMsg) noCoursesMsg.style.display = 'block';
        console.log('No courses to display');
    } else {
        // Hide no courses message
        if (noCoursesMsg) noCoursesMsg.style.display = 'none';
        
        enrolledCoursesData.forEach((course, index) => {
            const courseName = course.title || course.courseName || course.name || 'Untitled Course';
            console.log('Adding course to dropdown:', courseName, course);
            
            const option = document.createElement('div');
            option.className = 'custom-dropdown-option';
            if (index === 0) option.classList.add('selected');
            option.textContent = courseName;
            option.dataset.index = index;
            
            option.addEventListener('click', () => {
                selectCourse(index);
            });
            
            dropdownOptions.appendChild(option);
        });
        
        // Auto-select first course
        selectCourse(0);
    }
}

// Setup custom dropdown toggle
function setupCustomDropdown() {
    const dropdown = document.getElementById('customDropdown');
    const selected = document.getElementById('dropdownSelected');
    
    if (!dropdown || !selected) return;
    
    selected.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdown.classList.remove('open');
    });
}

function selectCourse(index) {
    const courseName = enrolledCoursesData[index]?.title || enrolledCoursesData[index]?.courseName || 'Untitled Course';
    
    // Update selected text
    const selectedText = document.getElementById('selectedCourseText');
    if (selectedText) selectedText.textContent = courseName;
    
    // Update selected class
    const options = document.querySelectorAll('.custom-dropdown-option');
    options.forEach(opt => opt.classList.remove('selected'));
    if (options[index]) options[index].classList.add('selected');
    
    // Close dropdown
    const dropdown = document.getElementById('customDropdown');
    if (dropdown) dropdown.classList.remove('open');
    
    // Update chart
    updateProgressChartForCourse(index);
}

function updateProgressChartForCourse(index) {
    const course = enrolledCoursesData[parseInt(index)];
    if (!course) {
        console.log('No course found for index:', index);
        return;
    }
    
    currentSelectedCourse = course;
    const progress = course.progress || 0;
    
    console.log('=== Selected Course ===');
    console.log('Course Name:', course.title || course.courseName || course.name);
    console.log('Course ID:', course.id);
    console.log('Progress (from Firebase):', progress + '%');
    console.log('Time Spent (from Firebase):', course.timeSpent, 'minutes');
    console.log('Sections Completed (from Firebase):', course.modulesCompleted || course.sectionsCompleted);
    console.log('Last Accessed (from Firebase):', course.lastAccessed);
    console.log('===================');
    
    // Update progress text
    const progressText = document.getElementById('courseProgressText');
    if (progressText) {
        progressText.textContent = `${Math.round(progress)}% complete`;
    }
    
    // Generate progress history data (uses real Firebase data if available)
    const progressHistory = generateProgressHistory(course);
    drawLineChart(progressHistory);
    
    // Update course details section with Firebase data
    updateCourseDetails(course);
}


function generateProgressHistory(course) {
    const progress = course.progress || 0;
    const history = [];
    const today = new Date();
    
    // Check if course has real progress history data from Firebase
    if (course.progressHistory && Array.isArray(course.progressHistory) && course.progressHistory.length > 0) {
        // Use real Firebase data
        console.log('Using real progress history from Firebase');
        return course.progressHistory.map(entry => ({
            date: entry.date.toDate ? entry.date.toDate() : new Date(entry.date),
            progress: entry.progress || 0
        }));
    }
    
    // Otherwise, generate a simple visualization based on current progress
    // Show progress growth over last 30 days
    console.log('Generating progress visualization for current progress:', progress);
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        let dayProgress = 0;
        if (i === 0) {
            // Today shows current progress
            dayProgress = progress;
        } else {
            // Gradual curve leading to current progress
            const ratio = (30 - i) / 30;
            dayProgress = progress * ratio;
        }
        
        history.push({
            date: date,
            progress: dayProgress
        });
    }
    
    return history;
}

function drawLineChart(data) {
    const canvas = document.getElementById('progressLineChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) {
        setTimeout(() => drawLineChart(data), 100);
        return;
    }
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!data || data.length === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Select a course to view progress', width / 2, height / 2);
        return;
    }
    
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Get color
    const purpleColor = getComputedStyle(document.documentElement).getPropertyValue('--color-brand-purple').trim() || '#8B5CF6';
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        // Y-axis labels
        const value = 100 - (i * 25);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(`${value}%`, padding.left - 10, y + 4);
    }
    
    // Draw line
    ctx.strokeStyle = purpleColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = padding.top + chartHeight - (point.progress / 100) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw dots
    data.forEach((point, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = padding.top + chartHeight - (point.progress / 100) * chartHeight;
        
        ctx.fillStyle = purpleColor;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw X-axis labels (show every 7 days)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < data.length; i += 7) {
        const point = data[i];
        const x = padding.left + (chartWidth / (data.length - 1)) * i;
        const dateStr = `${point.date.getMonth() + 1}/${point.date.getDate()}`;
        ctx.fillText(dateStr, x, height - padding.bottom + 20);
    }
    
    // Store for resize
    window.chartProgressData = data;
    window.drawLineChartGlobal = drawLineChart;
}

function updateCourseDetails(course) {
    const detailsContent = document.getElementById('courseDetailsContent');
    if (!detailsContent) return;
    
    if (!course) {
        detailsContent.innerHTML = '';
        return;
    }
    
    console.log('Displaying details for course:', course.title || course.name);
    console.log('Firebase data:', {
        timeSpent: course.timeSpent,
        progress: course.progress,
        modulesCompleted: course.modulesCompleted,
        lastAccessed: course.lastAccessed
    });
    
    // Time Spent (from Firebase)
    const timeSpent = course.timeSpent || 0;
    let timeText = '0 minutes';
    if (timeSpent > 0) {
        if (timeSpent >= 60) {
            const hours = Math.floor(timeSpent / 60);
            const mins = timeSpent % 60;
            timeText = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;
        } else {
            timeText = `${timeSpent} minutes`;
        }
    }
    
    // Progress (from Firebase)
    const progress = course.progress || 0;
    
    // Sections (from Firebase)
    const modulesCompleted = course.modulesCompleted || course.sectionsCompleted || 0;
    const totalModules = course.modules?.length || course.sections?.length || 0;
    
    // Last Accessed (from Firebase)
    const lastAccessed = course.lastAccessed ? (course.lastAccessed.toDate ? course.lastAccessed.toDate() : new Date(course.lastAccessed)) : null;
    
    detailsContent.innerHTML = `
        <div class="profile-field">
            <div class="profile-field-label">Time Spent</div>
            <div class="profile-field-value">
                <span>${timeText}</span>
            </div>
        </div>
        
        <div class="profile-field">
            <div class="profile-field-label">Completion</div>
            <div class="profile-field-value">
                <span>${Math.round(progress)}%</span>
            </div>
        </div>
        
        <div class="profile-field">
            <div class="profile-field-label">Sections Completed</div>
            <div class="profile-field-value">
                <span>${modulesCompleted} ${totalModules > 0 ? `/ ${totalModules}` : ''}</span>
            </div>
        </div>
        
        <div class="profile-field" style="border-bottom: none;">
            <div class="profile-field-label">Last Accessed</div>
            <div class="profile-field-value">
                <span>${lastAccessed ? formatDate(lastAccessed) : 'Not accessed yet'}</span>
            </div>
        </div>
    `;
}

function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const options = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
    }
    return date.toLocaleDateString('en-US', options);
}

// Handle resize
window.addEventListener('resize', () => {
    if (window.chartProgressData && window.drawLineChartGlobal) {
        drawLineChart(window.chartProgressData);
    }
});

// Observe when progress section becomes visible
const progressChartObserver = new MutationObserver(() => {
    const chartSection = document.getElementById('chartSection');
    if (chartSection && chartSection.classList.contains('active')) {
        if (window.chartProgressData && window.drawLineChartGlobal) {
            setTimeout(() => {
                drawLineChart(window.chartProgressData);
            }, 100);
        }
    }
});

setTimeout(() => {
    const progressSection = document.getElementById('progress');
    if (progressSection) {
        progressChartObserver.observe(progressSection, { attributes: true, attributeFilter: ['class'], subtree: true });
    }
}, 500);

// Initialize progress data when user is authenticated
function initProgressTracking() {
    // Setup custom dropdown
    setupCustomDropdown();
    
    if (window.firebase && window.firebase.auth) {
        window.firebase.auth.onAuthStateChanged(async user => {
            if (user) {
                console.log('[INIT] User authenticated, loading progress data for:', user.uid);
                
                // Load progress data and wait for it to complete
                await loadProgressData();
                
                console.log('[INIT] Progress data loaded, enrolled courses:', enrolledCoursesData.length);
                
                // Now render programs sections
                if (window.updateProgramsFilter && enrolledCoursesData.length > 0) {
                    console.log('[INIT] Rendering initial programs view');
                    window.updateProgramsFilter('all');
                }
            } else {
                console.log('No user authenticated');
            }
        });
    } else {
        console.log('Firebase not ready, retrying...');
        setTimeout(initProgressTracking, 500);
    }
}

// Reload data when window regains focus (user returns from course page)
let lastFocusTime = 0;
window.addEventListener('focus', function() {
    const now = Date.now();
    // Only reload if more than 2 seconds have passed since last focus
    if (now - lastFocusTime > 2000 && window.firebase && window.firebase.auth && window.firebase.auth.currentUser) {
        console.log('[FOCUS] Window regained focus, refreshing progress data');
        lastFocusTime = now;
        setTimeout(loadProgressData, 100);
    }
});

// Also reload when navigating back via browser history
window.addEventListener('pageshow', function(event) {
    if (event.persisted && window.firebase && window.firebase.auth && window.firebase.auth.currentUser) {
        console.log('[PAGESHOW] Page shown from cache, refreshing progress data');
        setTimeout(loadProgressData, 100);
    }
});

// Reload data every 10 seconds if user is on overview or programs section
setInterval(function() {
    if (window.firebase && window.firebase.auth && window.firebase.auth.currentUser) {
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection && (activeSection.id === 'overview' || activeSection.id === 'programs')) {
            console.log('[AUTO-REFRESH] Refreshing progress data for active section:', activeSection.id);
            loadProgressData();
        }
    }
}, 10000); // Every 10 seconds

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProgressTracking);
} else {
    initProgressTracking();
}

