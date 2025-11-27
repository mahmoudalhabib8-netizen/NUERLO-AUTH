import { 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    setDoc, 
    updateDoc, 
    arrayUnion,
    query,
    where 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Helper function to normalize image paths (convert relative to absolute)
function normalizeImagePath(path) {
    if (!path) return '';
    // If already absolute (starts with / or http), return as is
    if (path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://')) {
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
            difficulty: 'all'
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
            return;
        }
        
        await this.checkAuth();
        this.bindEvents();
        await this.loadCourses();
        await this.loadEnrolledCourses();
        await this.loadFavorites();
        console.log('Marketplace initialized, courses:', this.courses.length);
        this.initialized = true;
        this.renderCourses();
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
        // Search functionality
        const searchInput = document.querySelector('.search-input');
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
        
        // Apply filters immediately on desktop
        if (window.innerWidth > 768) {
            this.applyFilters();
        }
    }

    clearFilters() {
        // Reset all filters
        this.currentFilters = {
            category: 'all',
            price: 'all',
            difficulty: 'all'
        };
        
        // Remove active classes
        document.querySelectorAll('.filter-option, .filter-price, .filter-difficulty').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Set default active states
        document.querySelectorAll('[data-value="all"]').forEach(btn => {
            btn.classList.add('active');
        });
        
        // Clear search
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        this.searchQuery = '';
        
        // Apply filters
        this.applyFilters();
    }

    async loadCourses() {
        try {
            if (!window.firebase || !window.firebase.db) {
                console.log('Firebase not initialized, using fallback courses');
                this.loadFallbackCourses();
                return;
            }

            const coursesRef = collection(window.firebase.db, 'courses');
            
            // Check if courses exist first
            const coursesSnapshot = await getDocs(coursesRef);
            
            if (coursesSnapshot.empty) {
                console.log('No courses found in Firebase, initializing...');
                await this.initializeCourses();
                // Reload after initialization
                const newSnapshot = await getDocs(coursesRef);
                this.courses = newSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } else {
                console.log('Loading courses from Firebase:', coursesSnapshot.size);
                this.courses = coursesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Update student count to 112 for all courses
                const { updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                for (const course of this.courses) {
                    if (course.id === 'ai-powered-website-development' && course.students !== 112) {
                        const courseRef = doc(window.firebase.db, 'courses', course.id);
                        await updateDoc(courseRef, { students: 112 });
                        course.students = 112;
                        console.log('Updated course student count to 112:', course.id);
                    }
                }
            }
            
            this.filteredCourses = [...this.courses];
            console.log('Courses loaded:', this.courses.length, this.courses);
        } catch (error) {
            console.error('Error loading courses:', error);
            this.loadFallbackCourses();
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
                image: "/assets/images/COURSE-AI-WEBSITE.png",
                instructor: "Expert Team",
                duration: "8 weeks",
                lessons: 30,
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
            
            // Check if course already exists, if not create it
            for (const course of coursesData) {
                const courseRef = doc(window.firebase.db, 'courses', course.id);
                const courseDoc = await getDoc(courseRef);
                
                if (!courseDoc.exists()) {
                    console.log('Creating course in database:', course.id);
                    await setDoc(courseRef, course);
                    console.log('Course created successfully:', course.id);
                } else {
                    console.log('Course already exists in database:', course.id);
                    // Update course data but preserve enrolled array and students count
                    const existingData = courseDoc.data();
                    await setDoc(courseRef, {
                        ...course,
                        enrolled: existingData.enrolled || [],
                        students: existingData.students || 112 // Preserve actual student count
                    }, { merge: true });
                    console.log('Course data updated:', course.id);
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
                image: "/assets/images/COURSE-AI-WEBSITE.png",
                instructor: "Expert Team",
                duration: "8 weeks",
                lessons: 30
            }
        ];
        this.filteredCourses = [...this.courses];
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
        if (!this.currentUser || !window.firebase || !window.firebase.db) {
            // Load from localStorage as fallback
            const savedFavorites = localStorage.getItem('favoriteCourses');
            if (savedFavorites) {
                try {
                    this.favoriteCourseIds = JSON.parse(savedFavorites);
                } catch (e) {
                    this.favoriteCourseIds = [];
                }
            }
            return;
        }

        try {
            const userRef = doc(window.firebase.db, 'users', this.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.favoriteCourseIds = userData.favoriteCourses || [];
                // Sync to localStorage
                localStorage.setItem('favoriteCourses', JSON.stringify(this.favoriteCourseIds));
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            // Fallback to localStorage
            const savedFavorites = localStorage.getItem('favoriteCourses');
            if (savedFavorites) {
                try {
                    this.favoriteCourseIds = JSON.parse(savedFavorites);
                } catch (e) {
                    this.favoriteCourseIds = [];
                }
            }
        }
    }

    async toggleFavorite(courseId) {
        if (!this.currentUser && !window.firebase) {
            // Allow favorites without auth, store in localStorage
            const index = this.favoriteCourseIds.indexOf(courseId);
            if (index > -1) {
                this.favoriteCourseIds.splice(index, 1);
            } else {
                this.favoriteCourseIds.push(courseId);
            }
            localStorage.setItem('favoriteCourses', JSON.stringify(this.favoriteCourseIds));
            this.updateFavoriteButtons();
            return;
        }

        if (!this.currentUser) {
            alert('Please sign in to save favorites');
            return;
        }

        try {
            const userRef = doc(window.firebase.db, 'users', this.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            const isFavorited = this.favoriteCourseIds.includes(courseId);
            
            if (isFavorited) {
                // Remove from favorites
                this.favoriteCourseIds = this.favoriteCourseIds.filter(id => id !== courseId);
                if (userDoc.exists()) {
                    await updateDoc(userRef, {
                        favoriteCourses: this.favoriteCourseIds
                    });
                }
            } else {
                // Add to favorites
                this.favoriteCourseIds.push(courseId);
                if (userDoc.exists()) {
                    await updateDoc(userRef, {
                        favoriteCourses: arrayUnion(courseId)
                    });
                } else {
                    await setDoc(userRef, {
                        favoriteCourses: [courseId],
                        uid: this.currentUser.uid,
                        email: this.currentUser.email || ''
                    }, { merge: true });
                }
            }
            
            // Sync to localStorage
            localStorage.setItem('favoriteCourses', JSON.stringify(this.favoriteCourseIds));
            
            // Update UI
            this.updateFavoriteButtons();
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('Failed to update favorite. Please try again.');
        }
    }

    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.marketplace-course-favorite, .marketplace-course-favorite-small');
        favoriteButtons.forEach(btn => {
            const courseId = btn.getAttribute('data-course-id');
            if (this.favoriteCourseIds.includes(courseId)) {
                btn.classList.add('favorited');
            } else {
                btn.classList.remove('favorited');
            }
        });
    }

    applyFilters() {
        let filtered = [...this.courses];

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(course => 
                course.title.toLowerCase().includes(this.searchQuery) ||
                course.description.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply category filter
        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(course => course.category === this.currentFilters.category);
        }

        // Apply price filter
        if (this.currentFilters.price !== 'all') {
            filtered = filtered.filter(course => {
                const price = course.price;
                switch (this.currentFilters.price) {
                    case 'free':
                        return price === 0;
                    case 'under-50':
                        return price < 50;
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
        }

        // Apply difficulty filter
        if (this.currentFilters.difficulty !== 'all') {
            filtered = filtered.filter(course => course.difficulty === this.currentFilters.difficulty);
        }

        // Apply sorting
        filtered = this.sortCourses(filtered, this.sortBy);

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

    renderCourses() {
        const container = document.getElementById('marketplaceGrid') || document.querySelector('.programs-grid') || document.querySelector('.courses-grid-marketplace') || document.getElementById('libraryCoursesGrid');
        if (!container) {
            console.warn('Marketplace container not found');
            return;
        }

        console.log('Rendering courses, container found:', container.id || container.className);

        // Clear any loading placeholders
        const placeholder = container.querySelector('.courses-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const loadingState = container.querySelector('#marketplaceLoading');
        if (loadingState) {
            loadingState.style.display = 'none';
        }

        // Filter out enrolled courses from the marketplace
        const unenrolledCourses = this.filteredCourses.filter(
            course => !this.enrolledCourseIds.includes(course.id)
        );

        console.log('Unenrolled courses:', unenrolledCourses.length, 'Total courses:', this.filteredCourses.length);

        if (unenrolledCourses.length === 0) {
            container.innerHTML = `
                <div class="no-courses-library" style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--color-text-tertiary);">
                    <h3 style="color: var(--color-text-secondary); margin-bottom: 0.5rem;">No courses available</h3>
                    <p>${this.enrolledCourseIds.length > 0 ? 'You\'ve enrolled in all available courses! Check "My Programs" to continue learning.' : 'Try adjusting your filters or search terms'}</p>
                </div>
            `;
            return;
        }

        // Generate star SVG
        const starSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
        const emptyStarSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

        container.innerHTML = unenrolledCourses.map(course => {
            const isEnrolled = this.enrolledCourseIds.includes(course.id);
            const buttonText = this.currentUser ? 'Enroll' : 'Sign in to Enroll';
            const courseImage = normalizeImagePath(course.image || '/assets/images/COURSE-AI-WEBSITE.png');
            const rating = Math.floor(course.rating);
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
            
            return `
                <div class="marketplace-course-card" data-course-id="${course.id}" data-category="${course.category}" style="--course-image: url('${courseImage}');">
                    <div class="marketplace-course-image" style="display: none;">
                        <img src="${courseImage}" alt="${course.title}" loading="lazy" style="display: none;">
                    </div>
                    <div class="marketplace-course-content">
                        <div class="marketplace-course-header">
                            <h3 class="marketplace-course-title">${course.title}</h3>
                        </div>
                        <div class="marketplace-course-rating">
                            <div class="marketplace-course-stars">
                                ${starsHtml}
                            </div>
                            <span class="marketplace-course-rating-number">${course.rating.toFixed(1)}</span>
                            <span class="marketplace-course-students">${course.students.toLocaleString()} students</span>
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

            // Get current user document to check existing enrolledCourses
            const userDoc = await getDoc(userRef);
            const existingEnrolledCourses = userDoc.exists() ? (userDoc.data().enrolledCourses || []) : [];
            
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
}

// Initialize marketplace when DOM is loaded
async function initializeMarketplace() {
    // Check if marketplace section exists (multiple possible selectors)
    const marketplaceSection = document.querySelector('#marketplace') || 
                               document.querySelector('.marketplace-section') || 
                               document.querySelector('.ai-marketplace-section') || 
                               document.getElementById('marketplaceGrid') ||
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
