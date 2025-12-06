console.log('[MARKETPLACE.JS] Module loading started');

import { 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    setDoc, 
    updateDoc, 
    arrayUnion,
    arrayRemove,
    query,
    where 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

console.log('[MARKETPLACE.JS] Firebase imports successful');

// Helper function to normalize image paths (convert relative to absolute)
function normalizeImagePath(path) {
    if (!path || path.trim() === '') {
        return ''; // No default fallback - each course has its own image
    }
    // If already absolute (starts with / or http), return as is
    if (path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    // Convert relative path to absolute
    return '/' + path.replace(/^\/+/, ''); // Remove leading slashes and add one
}
class Marketplace {
    constructor() {
        this.courses = [];
        this.filteredCourses = [];
        this.enrolledCourseIds = [];
        this.favoriteCourseIds = [];
        this.currentFilters = {
            category: 'all',
            price: 'all',
            difficulty: 'all',
            duration: 'all'
        };
        this.searchQuery = '';
        this.sortBy = 'popular';
        this.currentUser = null;
        this.initialized = false;
        
        // Don't call init() here - let it be called explicitly
    }

    async init() {
        if (this.initialized) {
            console.log('Marketplace already initialized');
            // Still render courses in case filters changed
            this.applyFilters();
            return;
        }
        
        await this.checkAuth();
        this.bindEvents();
        await this.loadCourses();
        await this.loadEnrolledCourses();
        await this.loadFavorites();
        console.log('Marketplace initialized, courses:', this.courses.length);
        this.initialized = true;
        // Apply filters will call renderCourses
        this.applyFilters();
    }

    async checkAuth() {
        return new Promise((resolve) => {
            if (window.firebase && window.firebase.auth) {
                window.firebase.auth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    bindEvents() {
        // Search functionality - check multiple possible selectors
        const searchInput = document.querySelector('.marketplace-search-input') || 
                           document.querySelector('.search-input') ||
                           document.getElementById('marketplaceSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Sort functionality
        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-option')) {
                this.handleFilterClick(e.target, 'category');
            } else if (e.target.classList.contains('filter-price')) {
                this.handleFilterClick(e.target, 'price');
            } else if (e.target.classList.contains('filter-difficulty')) {
                this.handleFilterClick(e.target, 'difficulty');
            }
        });

        // Mobile filter toggle
        const mobileFilterToggle = document.querySelector('.mobile-filter-icon-toggle');
        const mobileFilterOverlay = document.querySelector('.mobile-filter-overlay');
        const mobileFilterClose = document.querySelector('.mobile-filter-close');
        const applyFiltersBtn = document.querySelector('.apply-filters-btn');
        const clearFiltersBtn = document.querySelector('.clear-filters-btn');

        if (mobileFilterToggle) {
            mobileFilterToggle.addEventListener('click', () => {
                mobileFilterOverlay.classList.add('active');
            });
        }

        if (mobileFilterClose) {
            mobileFilterClose.addEventListener('click', () => {
                mobileFilterOverlay.classList.remove('active');
            });
        }

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
                mobileFilterOverlay.classList.remove('active');
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Close mobile filter on overlay click
        if (mobileFilterOverlay) {
            mobileFilterOverlay.addEventListener('click', (e) => {
                if (e.target === mobileFilterOverlay) {
                    mobileFilterOverlay.classList.remove('active');
                }
            });
        }
    }

    handleFilterClick(element, filterType) {
        const value = element.dataset.value;
        
        // Remove active class from siblings
        const siblings = element.parentElement.querySelectorAll(`.filter-${filterType}`);
        siblings.forEach(sibling => sibling.classList.remove('active'));
        
        // Add active class to clicked element
        element.classList.add('active');
        
        // Update current filter
        this.currentFilters[filterType] = value;
        
        // Apply filters immediately (real-time filtering)
        this.applyFilters();
    }

    clearFilters() {
        // Reset all filters
        this.currentFilters = {
            category: 'all',
            price: 'all',
            difficulty: 'all',
            duration: 'all'
        };
        
        // Remove active classes from all filter chips
        document.querySelectorAll('.filter-chip, .marketplace-filter-option, .filter-option, .filter-price, .filter-difficulty').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Set default active states
        document.querySelectorAll('[data-value="all"]').forEach(btn => {
            btn.classList.add('active');
        });
        
        // Clear search - check multiple possible selectors
        const searchInput = document.querySelector('.marketplace-search-input') || 
                           document.querySelector('.search-input') ||
                           document.getElementById('marketplaceSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        this.searchQuery = '';
        
        // Apply filters
        this.applyFilters();
    }

    async loadCourses() {
        try {
            const isLocalPreview = window.location.protocol === 'file:' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === 'localhost';
            
            const user = window.firebase?.auth?.currentUser;
            
            if (isLocalPreview && !user) {
                console.log('Running locally without Firebase auth - using fallback courses');
                this.loadFallbackCourses();
                return;
            }
            
            if (isLocalPreview && user) {
                console.log('Running locally with Firebase auth - using fallback courses');
                this.loadFallbackCourses();
                return;
            }
            
            if (!window.firebase || !window.firebase.db) {
                console.log('Firebase not initialized, using fallback courses');
                this.loadFallbackCourses();
                return;
            }

            const coursesRef = collection(window.firebase.db, 'courses');
            
            // Check if courses exist first
            const coursesSnapshot = await getDocs(coursesRef);
            
            // Only initialize courses if user is admin/mentor and courses don't exist
            // Regular users shouldn't try to create courses (causes 400 errors)
            if (coursesSnapshot.empty) {
                // Check if user is admin/mentor before initializing
                if (user) {
                    try {
                        const userRef = doc(window.firebase.db, 'users', user.uid);
                        const userDoc = await getDoc(userRef);
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const userRole = userData.role;
                            if (userRole === 'admin' || userRole === 'mentor') {
                                console.log('User is admin/mentor, initializing courses...');
                                await this.initializeCourses();
                            } else {
                                console.log('User is not admin/mentor, skipping course initialization');
                            }
                        }
                    } catch (error) {
                        console.error('Error checking user role for course initialization:', error);
                    }
                }
            }
            
            // Reload courses after potential initialization
            const newSnapshot = await getDocs(coursesRef);
            
            if (newSnapshot.empty) {
                console.log('No courses found after initialization');
                this.loadFallbackCourses();
            } else {
                console.log('Loading courses from Firebase:', newSnapshot.size);
                this.courses = newSnapshot.docs.map(doc => {
                    const courseData = doc.data();
                    console.log('Course loaded:', doc.id, 'Title:', courseData.title, 'Image:', courseData.image);
                    return {
                        id: doc.id,
                        ...courseData
                    };
                });
                
                // Fetch real enrollment counts from users
                // DISABLED: Requires permission to read all users, which violates Firestore security rules
                // await this.updateEnrollmentCounts();
            }
            
            // Apply filters after loading courses to ensure all courses are properly filtered
            this.filteredCourses = [...this.courses];
            this.applyFilters();
            console.log('Courses loaded:', this.courses.length, this.courses);
        } catch (error) {
            console.error('Error loading courses:', error);
            this.loadFallbackCourses();
            // Apply filters even on fallback
            this.applyFilters();
        }
    }

    async updateEnrollmentCounts() {
        if (!window.firebase || !window.firebase.db) return;

        try {
            const usersRef = collection(window.firebase.db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            
            // Count enrollments for each course
            const enrollmentCounts = {};
            
            usersSnapshot.forEach((userDoc) => {
                const userData = userDoc.data();
                
                // Check both enrolledCourses and courseProgress
                const enrolledCourses = userData.enrolledCourses || [];
                const courseProgress = userData.courseProgress || {};
                
                // Combine both sources
                const allEnrolledCourses = new Set([
                    ...enrolledCourses,
                    ...Object.keys(courseProgress)
                ]);
                
                allEnrolledCourses.forEach(courseId => {
                    enrollmentCounts[courseId] = (enrollmentCounts[courseId] || 0) + 1;
                });
            });
            
            // Update course objects with real counts
            this.courses.forEach(course => {
                course.enrolledStudents = enrollmentCounts[course.id] || 0;
            });
            
            console.log('Updated enrollment counts:', enrollmentCounts);
        } catch (error) {
            console.error('Error updating enrollment counts:', error);
        }
    }

    async initializeCourses() {
        const coursesData = [
            {
                id: "ai-powered-website-development",
                title: "AI Websites & Automation",
                description: "Learn to build modern websites using AI tools. Create responsive designs and automation solutions for businesses.",
                category: "ai",
                price: 0,
                difficulty: "intermediate",
                rating: 4.8,
                students: 112,
                image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "8 weeks",
                lessons: 30,
                enrolled: [],
                createdAt: new Date()
            },
            {
                id: "ai-content-creation-copywriting",
                title: "AI Content Creation & Copywriting",
                description: "Master AI-powered content creation. Generate compelling copy, blog posts, and marketing materials using advanced AI tools.",
                category: "ai",
                price: 0,
                difficulty: "beginner",
                rating: 4.9,
                students: 87,
                image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "6 weeks",
                lessons: 24,
                enrolled: [],
                createdAt: new Date()
            },
            {
                id: "ai-data-analysis-insights",
                title: "AI Data Analysis & Insights",
                description: "Learn to analyze data and extract insights using AI. Build predictive models and automate data processing workflows.",
                category: "ai",
                price: 0,
                difficulty: "intermediate",
                rating: 4.7,
                students: 95,
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "10 weeks",
                lessons: 35,
                enrolled: [],
                createdAt: new Date()
            },
            {
                id: "ai-image-video-generation",
                title: "AI Image & Video Generation",
                description: "Create stunning visuals with AI. Master image generation, video editing, and creative automation using cutting-edge tools.",
                category: "ai",
                price: 0,
                difficulty: "beginner",
                rating: 4.8,
                students: 103,
                image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "7 weeks",
                lessons: 28,
                enrolled: [],
                createdAt: new Date()
            },
            {
                id: "ai-business-automation",
                title: "AI Business Automation",
                description: "Streamline your business operations with AI. Learn to automate workflows, customer service, and business processes for maximum efficiency.",
                category: "ai",
                price: 0,
                difficulty: "intermediate",
                rating: 4.9,
                students: 128,
                image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "9 weeks",
                lessons: 32,
                enrolled: [],
                createdAt: new Date()
            },
            {
                id: "ai-marketing-strategy",
                title: "AI Marketing Strategy & Analytics",
                description: "Master AI-driven marketing strategies. Learn to optimize campaigns, analyze customer behavior, and automate marketing workflows.",
                category: "ai",
                price: 0,
                difficulty: "intermediate",
                rating: 4.7,
                students: 156,
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "8 weeks",
                lessons: 30,
                enrolled: [],
                createdAt: new Date()
            },
            {
                id: "ai-productivity-tools",
                title: "AI Productivity & Workflow Tools",
                description: "Boost your productivity with AI tools. Learn to automate tasks, manage projects, and optimize your daily workflow using intelligent systems.",
                category: "ai",
                price: 0,
                difficulty: "beginner",
                rating: 4.8,
                students: 142,
                image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "6 weeks",
                lessons: 22,
                enrolled: [],
                createdAt: new Date()
            },
            {
                id: "ai-entrepreneurship",
                title: "AI Entrepreneurship & Innovation",
                description: "Build AI-powered businesses from the ground up. Learn to identify opportunities, develop AI solutions, and scale innovative ventures.",
                category: "ai",
                price: 0,
                difficulty: "advanced",
                rating: 4.9,
                students: 98,
                image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "12 weeks",
                lessons: 40,
                enrolled: [],
                createdAt: new Date()
            }
        ];

        try {
            // Wait for Firebase to be ready
            if (!window.firebase || !window.firebase.db) {
                console.log('Waiting for Firebase to initialize...');
                let attempts = 0;
                while (!window.firebase?.db && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
            }
            
            if (!window.firebase?.db) {
                console.error('Firebase not available for course initialization');
                return;
            }
            
            // Check if user is authenticated and has admin/mentor role
            const user = window.firebase.auth.currentUser;
            if (!user) {
                console.error('User not authenticated, cannot initialize courses');
                return;
            }
            
            // Verify user has admin or mentor role
            try {
                const userRef = doc(window.firebase.db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                if (!userDoc.exists()) {
                    console.error('User document not found, cannot initialize courses');
                    return;
                }
                
                const userData = userDoc.data();
                const userRole = userData.role;
                if (userRole !== 'admin' && userRole !== 'mentor') {
                    console.error('User does not have admin/mentor role, cannot initialize courses');
                    return;
                }
            } catch (error) {
                console.error('Error checking user permissions:', error);
                return;
            }
            
            // FORCE UPDATE all courses with new images (only if admin/mentor)
            for (const course of coursesData) {
                try {
                    const courseRef = doc(window.firebase.db, 'courses', course.id);
                    const courseDoc = await getDoc(courseRef);
                    
                    // Preserve enrolled array if exists
                    const enrolled = courseDoc.exists() ? (courseDoc.data().enrolled || []) : [];
                    
                    // COMPLETELY OVERWRITE course data with new image
                    await setDoc(courseRef, {
                        ...course,
                        enrolled: enrolled
                    }).catch(error => {
                        console.error(`Error updating course ${course.id}:`, error);
                        // Continue with next course even if this one fails
                    });
                    
                    console.log('✅ Course OVERWRITTEN:', course.id);
                    console.log('   Image:', course.image);
                } catch (error) {
                    console.error(`Error processing course ${course.id}:`, error);
                    // Continue with next course
                }
            }
            console.log('Courses initialization complete');
        } catch (error) {
            console.error('Error initializing courses:', error);
        }
    }

    loadFallbackCourses() {
        this.courses = [
            {
                id: "ai-powered-website-development",
                title: "Website Development with AI",
                description: "Learn to build modern websites using AI tools. Create responsive designs and automation solutions for businesses.",
                category: "ai",
                price: 0,
                difficulty: "intermediate",
                rating: 4.8,
                students: 112,
                image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "8 weeks",
                lessons: 30
            },
            {
                id: "ai-content-creation-copywriting",
                title: "AI Content Creation & Copywriting",
                description: "Master AI-powered content creation. Generate compelling copy, blog posts, and marketing materials using advanced AI tools.",
                category: "ai",
                price: 0,
                difficulty: "beginner",
                rating: 4.9,
                students: 87,
                image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "6 weeks",
                lessons: 24
            },
            {
                id: "ai-data-analysis-insights",
                title: "AI Data Analysis & Insights",
                description: "Learn to analyze data and extract insights using AI. Build predictive models and automate data processing workflows.",
                category: "ai",
                price: 0,
                difficulty: "intermediate",
                rating: 4.7,
                students: 95,
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "10 weeks",
                lessons: 35
            },
            {
                id: "ai-image-video-generation",
                title: "AI Image & Video Generation",
                description: "Create stunning visuals with AI. Master image generation, video editing, and creative automation using cutting-edge tools.",
                category: "ai",
                price: 0,
                difficulty: "beginner",
                rating: 4.8,
                students: 103,
                image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "7 weeks",
                lessons: 28
            },
            {
                id: "ai-business-automation",
                title: "AI Business Automation",
                description: "Streamline your business operations with AI. Learn to automate workflows, customer service, and business processes for maximum efficiency.",
                category: "ai",
                price: 0,
                difficulty: "intermediate",
                rating: 4.9,
                students: 128,
                image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "9 weeks",
                lessons: 32
            },
            {
                id: "ai-marketing-strategy",
                title: "AI Marketing Strategy & Analytics",
                description: "Master AI-driven marketing strategies. Learn to optimize campaigns, analyze customer behavior, and automate marketing workflows.",
                category: "ai",
                price: 0,
                difficulty: "intermediate",
                rating: 4.7,
                students: 156,
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "8 weeks",
                lessons: 30
            },
            {
                id: "ai-productivity-tools",
                title: "AI Productivity & Workflow Tools",
                description: "Boost your productivity with AI tools. Learn to automate tasks, manage projects, and optimize your daily workflow using intelligent systems.",
                category: "ai",
                price: 0,
                difficulty: "beginner",
                rating: 4.8,
                students: 142,
                image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "6 weeks",
                lessons: 22
            },
            {
                id: "ai-entrepreneurship",
                title: "AI Entrepreneurship & Innovation",
                description: "Build AI-powered businesses from the ground up. Learn to identify opportunities, develop AI solutions, and scale innovative ventures.",
                category: "ai",
                price: 0,
                difficulty: "advanced",
                rating: 4.9,
                students: 98,
                image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop&auto=format&q=80",
                instructor: "Expert Team",
                duration: "12 weeks",
                lessons: 40
            }
        ];
        this.filteredCourses = [...this.courses];
        // Apply filters to fallback courses as well
        this.applyFilters();
    }

    async loadEnrolledCourses() {
        if (!this.currentUser || !window.firebase || !window.firebase.db) {
            return;
        }

        try {
            const userRef = doc(window.firebase.db, 'users', this.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.enrolledCourseIds = userData.enrolledCourses || [];
            }
        } catch (error) {
            console.error('Error loading enrolled courses:', error);
        }
    }

    async loadFavorites() {
        // Load from localStorage only
        const savedFavorites = localStorage.getItem('favoriteCourses');
        if (savedFavorites) {
            try {
                this.favoriteCourseIds = JSON.parse(savedFavorites);
            } catch (e) {
                this.favoriteCourseIds = [];
            }
        } else {
            this.favoriteCourseIds = [];
        }
    }

    async toggleFavorite(courseId) {
        // Use localStorage only for favorites
        const index = this.favoriteCourseIds.indexOf(courseId);
        if (index > -1) {
            this.favoriteCourseIds.splice(index, 1);
        } else {
            this.favoriteCourseIds.push(courseId);
        }
        
        // Save to localStorage
        localStorage.setItem('favoriteCourses', JSON.stringify(this.favoriteCourseIds));
        
        // Update UI
        this.updateFavoriteButtons();
    }

    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.marketplace-course-favorite, .marketplace-course-favorite-small');
        favoriteButtons.forEach(btn => {
            const courseId = btn.getAttribute('data-course-id');
            const svg = btn.querySelector('svg');
            if (this.favoriteCourseIds.includes(courseId)) {
                btn.classList.add('favorited');
                if (svg) {
                    svg.setAttribute('fill', 'currentColor');
                }
            } else {
                btn.classList.remove('favorited');
                if (svg) {
                    svg.setAttribute('fill', 'none');
                }
            }
        });
    }

    applyFilters() {
        console.log('Applying filters...', this.currentFilters, 'Total courses:', this.courses.length);
        
        // Make sure we have courses to filter
        if (!this.courses || this.courses.length === 0) {
            console.warn('No courses available to filter');
            this.filteredCourses = [];
            this.renderCourses();
            return;
        }
        
        let filtered = [...this.courses];

        // Apply search filter
        if (this.searchQuery && this.searchQuery.trim()) {
            filtered = filtered.filter(course => 
                (course.title && course.title.toLowerCase().includes(this.searchQuery)) ||
                (course.description && course.description.toLowerCase().includes(this.searchQuery))
            );
            console.log('After search filter:', filtered.length);
        }

        // Apply category filter
        if (this.currentFilters.category && this.currentFilters.category !== 'all') {
            if (this.currentFilters.category === 'favorited') {
                // Show only favorited courses
                filtered = filtered.filter(course => this.favoriteCourseIds.includes(course.id));
            } else {
                // Map HTML filter values to actual course categories
                const categoryMap = {
                    'ai': 'ai',
                    'ai-writing': 'ai',
                    'ai-design': 'ai',
                    'ai-coding': 'ai',
                    'ai-data': 'ai',
                    'ai-marketing': 'ai',
                    'automation': 'ai',
                    'productivity': 'ai',
                    'business': 'ai',
                    'tech': 'ai',
                    'design': 'ai'
                };
                const mappedCategory = categoryMap[this.currentFilters.category] || this.currentFilters.category;
                filtered = filtered.filter(course => {
                    const courseCategory = course.category || 'ai';
                    return courseCategory === mappedCategory || courseCategory === this.currentFilters.category;
                });
            }
            console.log('After category filter:', filtered.length, 'Category:', this.currentFilters.category);
        }

        // Apply price filter
        if (this.currentFilters.price && this.currentFilters.price !== 'all') {
            filtered = filtered.filter(course => {
                const price = course.price || 0;
                switch (this.currentFilters.price) {
                    case 'free':
                        return price === 0;
                    case 'under-50':
                        return price > 0 && price < 50;
                    case '50-100':
                        return price >= 50 && price <= 100;
                    case '100-200':
                        return price >= 100 && price <= 200;
                    case '200-plus':
                        return price > 200;
                    default:
                        return true;
                }
            });
            console.log('After price filter:', filtered.length);
        }

        // Apply difficulty filter
        if (this.currentFilters.difficulty && this.currentFilters.difficulty !== 'all') {
            filtered = filtered.filter(course => {
                const courseDifficulty = course.difficulty || '';
                // Handle both "beginner" and "absolute-beginner" as beginner
                if (this.currentFilters.difficulty === 'beginner') {
                    return courseDifficulty === 'beginner' || courseDifficulty === 'absolute-beginner';
                }
                return courseDifficulty === this.currentFilters.difficulty;
            });
            console.log('After difficulty filter:', filtered.length, 'Difficulty:', this.currentFilters.difficulty);
        }

        // Apply duration filter
        if (this.currentFilters.duration && this.currentFilters.duration !== 'all') {
            filtered = filtered.filter(course => {
                const duration = course.duration || '';
                // Extract number from duration string (e.g., "8 weeks" -> 8, "12 weeks" -> 12)
                const weeksMatch = duration.toString().match(/\d+/);
                const weeks = weeksMatch ? parseInt(weeksMatch[0]) : 0;
                
                switch (this.currentFilters.duration) {
                    case 'short':
                        return weeks > 0 && weeks < 4;
                    case 'medium':
                        return weeks >= 4 && weeks <= 8;
                    case 'long':
                        return weeks > 8 && weeks <= 12;
                    case 'extended':
                        return weeks > 12;
                    default:
                        return true;
                }
            });
            console.log('After duration filter:', filtered.length);
        }

        // Apply sorting
        filtered = this.sortCourses(filtered, this.sortBy);

        console.log('Final filtered courses:', filtered.length);
        this.filteredCourses = filtered;
        this.renderCourses();
    }

    sortCourses(courses, sortBy) {
        const sorted = [...courses];
        
        switch (sortBy) {
            case 'popular':
                return sorted.sort((a, b) => b.students - a.students);
            case 'rating':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'newest':
                return sorted.sort((a, b) => b.id - a.id);
            default:
                return sorted;
        }
    }

    renderCourses(targetContainerId = null) {
        // If targetContainerId is specified, use that container
        let container = null;
        
        if (targetContainerId) {
            container = document.getElementById(targetContainerId);
        } else {
            // Check for recommendedGrid first if it exists and is visible
            const recommendedGrid = document.getElementById('recommendedGrid');
            if (recommendedGrid && recommendedGrid.offsetParent !== null) {
                container = recommendedGrid;
            } else {
                container = document.getElementById('marketplaceGrid') || 
                           document.querySelector('.programs-grid') || 
                           document.querySelector('.courses-grid-marketplace') || 
                           document.getElementById('libraryCoursesGrid');
            }
        }
        
        if (!container) {
            console.warn('Marketplace container not found');
            return;
        }

        const isRecommendedGrid = container.id === 'recommendedGrid';
        console.log('Rendering courses, container found:', container.id || container.className, 'isRecommendedGrid:', isRecommendedGrid);

        // Clear any loading placeholders
        const placeholder = container.querySelector('.courses-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const loadingState = container.querySelector('#marketplaceLoading') || container.querySelector('#recommendedLoading');
        if (loadingState) {
            loadingState.style.display = 'none';
        }

        // Filter out enrolled courses only for recommended section
        // Main marketplace should show all courses (enrolled or not)
        let coursesToRender;
        if (container.id === 'recommendedGrid') {
            // Recommended section: only show unenrolled courses
            const unenrolledCourses = this.filteredCourses.filter(
                course => !this.enrolledCourseIds.includes(course.id)
            );
            coursesToRender = unenrolledCourses.slice(0, 3);
            console.log('Recommended section - Unenrolled courses:', unenrolledCourses.length, 'Courses to render:', coursesToRender.length);
        } else {
            // Main marketplace: show all filtered courses
            coursesToRender = this.filteredCourses;
            console.log('Marketplace - Courses to render:', coursesToRender.length, 'Total filtered courses:', this.filteredCourses.length);
        }

        if (coursesToRender.length === 0) {
            container.innerHTML = `
                <div class="no-courses-library" style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--color-text-tertiary);">
                    <h3 style="color: var(--color-text-secondary); margin-bottom: 0.5rem;">No courses found</h3>
                    <p>Try adjusting your filters or search terms to see more courses.</p>
                    <button onclick="window.marketplace?.clearFilters()" style="margin-top: 1rem; padding: 8px 16px; background: transparent; color: var(--color-text-primary); border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s ease;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        <span>Clear All Filters</span>
                    </button>
                </div>
            `;
            return;
        }

        // Generate star SVG
        const starSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
        const emptyStarSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

        console.log('Courses to render:', coursesToRender.map(c => ({ id: c.id, title: c.title, image: c.image, hasImage: !!c.image })));
        
        // FORCE clear any old cards and ensure clean state
        const existingOldCards = container.querySelectorAll('.program-card, .marketplace-course-card');
        if (existingOldCards.length > 0) {
            console.warn('Found old card elements, removing them:', existingOldCards.length);
            existingOldCards.forEach(card => card.remove());
        }
        
        // Clear container completely before rendering
        container.innerHTML = '';
        
        // Render new cards
        container.innerHTML = coursesToRender.map(course => {
            const isEnrolled = this.enrolledCourseIds.includes(course.id);
            const buttonText = this.currentUser ? 'Enroll' : 'Sign in to Enroll';
            
            // Get image - check multiple possible field names
            const rawImage = course.image || 
                             course.imageURL || 
                             course.thumbnail || 
                             course.coverImage || 
                             course.photo;
            
            // Normalize the image path (function handles fallback)
            const courseImage = normalizeImagePath(rawImage);
            
            console.log(`Course ${course.id} image:`, courseImage, 'Original fields:', { 
                image: course.image, 
                imageURL: course.imageURL,
                thumbnail: course.thumbnail,
                coverImage: course.coverImage 
            });
            
            const rating = Math.floor(course.rating || 0);
            const isFavorited = this.favoriteCourseIds.includes(course.id);
            const favoriteClass = isFavorited ? ' favorited' : '';
            
            // Generate stars
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < rating) {
                    starsHtml += starSvg;
                } else {
                    starsHtml += emptyStarSvg;
                }
            }
            
            // Ensure CSS variable is set correctly with proper URL formatting
            const imageStyle = `--course-image: url('${courseImage}');`;
            
            return `
                <div class="marketplace-course-card" data-course-id="${course.id}" data-category="${course.category || ''}" style="${imageStyle}">
                    <div class="marketplace-course-image" style="display: none;">
                        <img src="${courseImage}" alt="${course.title}" loading="lazy" style="display: none;">
                    </div>
                    <div class="marketplace-course-content">
                        <div class="marketplace-course-header">
                            <h3 class="marketplace-course-title">${course.title}</h3>
                            <p class="marketplace-course-description">${course.description || ''}</p>
                        </div>
                        <div class="marketplace-course-rating">
                            <div class="marketplace-course-stars">
                                ${starsHtml}
                            </div>
                            <span class="marketplace-course-rating-number">${course.rating.toFixed(1)}</span>
                            <span class="marketplace-course-students">${(course.enrolledStudents || 0).toLocaleString()} ${(course.enrolledStudents === 1) ? 'student' : 'students'}</span>
                        </div>
                        <div class="marketplace-course-actions">
                            <button class="marketplace-course-enroll-btn" onclick="event.stopPropagation(); window.marketplace.enrollInCourse('${course.id}')">${buttonText}</button>
                            <button class="marketplace-course-favorite-small${favoriteClass}" data-course-id="${course.id}" onclick="event.stopPropagation(); window.marketplace.toggleFavorite('${course.id}')" title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFavorited ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async enrollInCourse(courseId) {
        if (!this.currentUser) {
            if (typeof window.openAuthModal === 'function') {
                window.openAuthModal();
            } else {
                alert('Please sign in to enroll in courses');
            }
            return;
        }

        if (this.enrolledCourseIds.includes(courseId)) {
            alert('You are already enrolled in this course!');
            return;
        }

        try {
            const userRef = doc(window.firebase.db, 'users', this.currentUser.uid);
            const course = this.courses.find(c => c.id === courseId);
            
            if (!course) {
                alert('Course not found');
                return;
            }

            console.log('Enrolling user:', this.currentUser.uid, 'in course:', courseId);

            // Get current user document to check existing enrolledCourses and subscription
            const userDoc = await getDoc(userRef);
            const userData = userDoc.exists() ? userDoc.data() : {};
            const existingEnrolledCourses = userData.enrolledCourses || [];
            const subscription = userData.subscription || null;
            
            // Check if user is on free plan and has reached the 3-course limit
            const isOnFreePlan = !subscription || !subscription.status || 
                                 (subscription.status !== 'active' && subscription.status !== 'trialing');
            
            if (isOnFreePlan && existingEnrolledCourses.length >= 3) {
                const message = 'Free plan users can only enroll in up to 3 courses. Please upgrade to a paid plan to enroll in more courses.';
                if (typeof window.showCustomNotification === 'function') {
                    window.showCustomNotification('error', 'Enrollment Limit Reached', message);
                } else {
                    alert(message);
                }
                return;
            }
            
            // Use updateDoc with arrayUnion if user doc exists, otherwise create it
            if (userDoc.exists()) {
                await updateDoc(userRef, {
                    enrolledCourses: arrayUnion(courseId)
                });
                console.log('Updated user document with enrolledCourses arrayUnion');
            } else {
                await setDoc(userRef, {
                    enrolledCourses: [courseId],
                    uid: this.currentUser.uid,
                    email: this.currentUser.email || '',
                    displayName: this.currentUser.displayName || '',
                    createdAt: new Date()
                });
                console.log('Created new user document with enrolledCourses');
            }

            // Verify user document was updated
            const verifyUserDoc = await getDoc(userRef);
            const updatedEnrolledCourses = verifyUserDoc.data().enrolledCourses || [];
            console.log('User enrolledCourses after update:', updatedEnrolledCourses);

            // Update course document - add user to enrolled array and increment student count
            const courseRef = doc(window.firebase.db, 'courses', courseId);
            const courseDoc = await getDoc(courseRef);
            
            if (courseDoc.exists()) {
                await updateDoc(courseRef, {
                    enrolled: arrayUnion(this.currentUser.uid),
                    students: (courseDoc.data().students || 0) + 1
                });
                console.log('Updated course document with enrollment');
            } else {
                // Course doesn't exist in database, create it
                await setDoc(courseRef, {
                    ...course,
                    enrolled: [this.currentUser.uid],
                    students: 1
                });
                console.log('Created course document in database');
            }

            // Update local state
            this.enrolledCourseIds.push(courseId);

            // Update enrollment counts
            // DISABLED: Requires permission to read all users
            // await this.updateEnrollmentCounts();

            // Refresh dashboard sections to show newly enrolled course
            if (typeof window.loadContinueLearning === 'function') {
                await window.loadContinueLearning();
            }
            if (typeof window.loadCoursesContent === 'function') {
                await window.loadCoursesContent();
            }
            
            // Update marketplace UI to show enrolled status
            this.renderCourses();

            // Show success notification
            if (typeof window.showCustomNotification === 'function') {
                window.showCustomNotification('success', 'Enrolled!', `You've successfully enrolled in ${course.title}`);
            } else {
                alert(`Successfully enrolled in ${course.title}!`);
            }

        } catch (error) {
            console.error('Error enrolling in course:', error);
            if (typeof window.showCustomNotification === 'function') {
                window.showCustomNotification('error', 'Enrollment Failed', 'Please try again');
            } else {
                alert('Failed to enroll. Please try again.');
            }
        }
    }

    async unenrollFromCourse(courseId) {
        // Get current user from Firebase auth directly
        let currentUser = this.currentUser;
        if (!currentUser && window.firebase && window.firebase.auth) {
            currentUser = window.firebase.auth.currentUser;
        }
        
        if (!currentUser) {
            alert('Please sign in to unenroll from courses');
            return;
        }

        // Check enrollment status from Firestore if not in local cache
        let isEnrolled = this.enrolledCourseIds.includes(courseId);
        if (!isEnrolled) {
            try {
                const userRef = doc(window.firebase.db, 'users', currentUser.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const enrolledCourses = userDoc.data().enrolledCourses || [];
                    isEnrolled = enrolledCourses.includes(courseId) || enrolledCourses.some(id => String(id) === String(courseId));
                }
            } catch (error) {
                console.error('Error checking enrollment:', error);
            }
        }

        if (!isEnrolled) {
            alert('You are not enrolled in this course!');
            return;
        }

        try {
            const userRef = doc(window.firebase.db, 'users', currentUser.uid);
            const course = this.courses.find(c => c.id === courseId);
            let courseDoc = null;
            
            if (!course) {
                // Try to get course from Firestore if not in local cache
                const courseRef = doc(window.firebase.db, 'courses', courseId);
                courseDoc = await getDoc(courseRef);
                if (!courseDoc.exists()) {
                    alert('Course not found');
                    return;
                }
            }

            console.log('Unenrolling user:', currentUser.uid, 'from course:', courseId);

            // Remove course from user's enrolledCourses array
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                await updateDoc(userRef, {
                    enrolledCourses: arrayRemove(courseId)
                });
                console.log('Removed course from user document');
            }

            // Update course document - remove user from enrolled array and decrement student count
            const courseRef = doc(window.firebase.db, 'courses', courseId);
            if (!courseDoc) {
                courseDoc = await getDoc(courseRef);
            }
            
            if (courseDoc.exists()) {
                const currentStudents = courseDoc.data().students || 0;
                await updateDoc(courseRef, {
                    enrolled: arrayRemove(currentUser.uid),
                    students: Math.max(0, currentStudents - 1) // Don't go below 0
                });
                console.log('Removed user from course document and decremented student count');
            }

            // Update local state
            this.enrolledCourseIds = this.enrolledCourseIds.filter(id => id !== courseId);
            if (this.currentUser) {
                this.currentUser = currentUser;
            }

            // Update enrollment counts
            // DISABLED: Requires permission to read all users
            // await this.updateEnrollmentCounts();

            // Show success notification
            const courseTitle = course?.title || courseDoc?.data()?.title || 'this course';
            if (typeof window.showCustomNotification === 'function') {
                window.showCustomNotification('success', 'Unenrolled', `You've left ${courseTitle}`);
            } else {
                alert(`Successfully left ${courseTitle}!`);
            }

            // Redirect to dashboard
            window.location.href = '/dashboard.html';

        } catch (error) {
            console.error('Error unenrolling from course:', error);
            if (typeof window.showCustomNotification === 'function') {
                window.showCustomNotification('error', 'Unenrollment Failed', 'Please try again');
            } else {
                alert('Failed to unenroll. Please try again.');
            }
        }
    }
}

// Load recommended courses for overview section
async function loadRecommendedCourses() {
    const recommendedGrid = document.getElementById('recommendedGrid');
    const recommendedLoading = document.getElementById('recommendedLoading');
    
    if (!recommendedGrid) return;

    // Show loading spinner, clear old courses
    if (recommendedLoading) {
        recommendedLoading.style.display = 'block';
    }
    
    // Clear old cards but keep loading spinner
    const oldCards = recommendedGrid.querySelectorAll('.marketplace-course-card');
    oldCards.forEach(card => card.remove());

    // If marketplace already initialized and has courses, render immediately
    if (window.marketplace && window.marketplace.initialized && window.marketplace.courses.length > 0) {
        window.marketplace.renderCourses('recommendedGrid');
        return;
    }

    // Marketplace not ready - initialize it
    if (!window.marketplace || !window.marketplace.initialized) {
        if (typeof Marketplace !== 'undefined') {
            window.marketplace = new Marketplace();
            await window.marketplace.init();
        } else {
            return;
        }
    }

    // Render courses
    if (window.marketplace && window.marketplace.initialized) {
        window.marketplace.renderCourses('recommendedGrid');
    }
}

// Export to global scope for dashboard.html to use
window.loadRecommendedCourses = loadRecommendedCourses;
console.log('[MARKETPLACE.JS] loadRecommendedCourses exported to window');

// Initialize marketplace when DOM is loaded
async function initializeMarketplace() {
    // Check if marketplace section exists (multiple possible selectors)
    const marketplaceSection = document.querySelector('#marketplace') || 
                               document.querySelector('.marketplace-section') || 
                               document.querySelector('.ai-marketplace-section') || 
                               document.getElementById('marketplaceGrid') ||
                               document.getElementById('recommendedGrid') ||
                               document.getElementById('libraryCoursesGrid');
    
    if (!marketplaceSection) {
        console.log('Marketplace section not found');
        return;
    }
    
    // Ensure Marketplace class is available
    if (typeof Marketplace === 'undefined') {
        console.error('Marketplace class not defined');
        return;
    }
    
    // Always create a new instance if window.marketplace doesn't exist or isn't properly initialized
    if (!window.marketplace || typeof window.marketplace.init !== 'function' || !(window.marketplace instanceof Marketplace)) {
        console.log('Creating new Marketplace instance');
        window.marketplace = new Marketplace();
        await window.marketplace.init();
    } else if (window.marketplace && window.marketplace.initialized && typeof window.marketplace.renderCourses === 'function') {
        // If marketplace already exists and is initialized, just reload courses
        console.log('Marketplace already exists, re-rendering courses');
        window.marketplace.renderCourses();
    } else if (window.marketplace && !window.marketplace.initialized && typeof window.marketplace.init === 'function') {
        console.log('Marketplace instance exists but not initialized, initializing now...');
        await window.marketplace.init();
    } else {
        console.log('Marketplace instance exists but not ready, reinitializing...');
        window.marketplace = new Marketplace();
        await window.marketplace.init();
    }
    
    // Load recommended courses if currently on overview section
    const overviewSection = document.getElementById('overview');
    if (overviewSection && overviewSection.classList.contains('active')) {
        loadRecommendedCourses();
    }
}

document.addEventListener('DOMContentLoaded', initializeMarketplace);

// Also try after a short delay in case Firebase isn't ready
setTimeout(initializeMarketplace, 500);

// Initialize when navigating to marketplace section
document.addEventListener('click', async function(e) {
    const navLink = e.target.closest('.nav-link[data-section="marketplace"]');
    if (navLink) {
        setTimeout(async () => {
            if (!window.marketplace || typeof window.marketplace.init !== 'function') {
                await initializeMarketplace();
            } else if (window.marketplace && window.marketplace.initialized && typeof window.marketplace.renderCourses === 'function') {
                window.marketplace.renderCourses();
            } else {
                await initializeMarketplace();
            }
        }, 100);
    }
});

// Mobile filter toggle functionality
function toggleMobileFilters() {
    const overlay = document.querySelector('.mobile-filter-overlay');
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

// Close mobile filters when clicking outside
document.addEventListener('click', (e) => {
    const overlay = document.querySelector('.mobile-filter-overlay');
    if (overlay && overlay.classList.contains('active')) {
        if (!overlay.contains(e.target) && !e.target.closest('.mobile-filter-icon-toggle')) {
            overlay.classList.remove('active');
        }
    }
});

// Export for use in other scripts
window.Marketplace = Marketplace;
window.toggleMobileFilters = toggleMobileFilters;
window.initializeMarketplace = initializeMarketplace;

// Make initializeCourses available globally for updating courses
window.initializeMarketplaceCourses = async function() {
    const marketplace = new Marketplace();
    await marketplace.checkAuth();
    await marketplace.initializeCourses();
    console.log('Courses updated in Firebase. Please refresh the page.');
};

// Force update course images
window.updateCourseImages = async function() {
    try {
        if (!window.firebase || !window.firebase.db) {
            console.error('Firebase not initialized');
            return;
        }

        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const imageUpdates = {
            "ai-powered-website-development": "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop&auto=format&q=80",
            "ai-content-creation-copywriting": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop&auto=format&q=80",
            "ai-data-analysis-insights": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&auto=format&q=80",
            "ai-image-video-generation": "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&h=450&fit=crop&auto=format&q=80"
        };

        for (const [courseId, imageUrl] of Object.entries(imageUpdates)) {
            const courseRef = doc(window.firebase.db, 'courses', courseId);
            await updateDoc(courseRef, { image: imageUrl });
            console.log('Updated image for:', courseId);
        }

        console.log('All course images updated! Refreshing page...');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error('Error updating images:', error);
    }
};
