// Search Autocomplete Functionality
class SearchAutocomplete {
    constructor() {
        this.desktopInput = document.getElementById('headerSearchInput');
        this.mobileInput = document.getElementById('mobileSearchInput');
        this.desktopSuggestions = document.getElementById('headerSearchSuggestions');
        this.mobileSuggestions = document.getElementById('mobileSearchSuggestions');
        this.desktopClearBtn = document.getElementById('headerSearchClear');
        this.mobileClearBtn = document.getElementById('mobileSearchClear');
        
        this.currentFocus = -1;
        this.courses = this.getCourses();
        
        this.init();
    }
    
    init() {
        if (this.desktopInput) {
            this.desktopInput.addEventListener('input', (e) => this.handleInput(e, 'desktop'));
            this.desktopInput.addEventListener('keydown', (e) => this.handleKeyDown(e, 'desktop'));
            this.desktopInput.addEventListener('focus', (e) => {
                if (e.target.value) {
                    this.handleInput(e, 'desktop');
                }
            });
        }
        
        if (this.mobileInput) {
            this.mobileInput.addEventListener('input', (e) => this.handleInput(e, 'mobile'));
            this.mobileInput.addEventListener('keydown', (e) => this.handleKeyDown(e, 'mobile'));
            this.mobileInput.addEventListener('focus', (e) => {
                if (e.target.value) {
                    this.handleInput(e, 'mobile');
                }
            });
        }
        
        if (this.desktopClearBtn) {
            this.desktopClearBtn.addEventListener('click', () => this.clearSearch('desktop'));
        }
        
        if (this.mobileClearBtn) {
            this.mobileClearBtn.addEventListener('click', () => this.clearSearch('mobile'));
        }
        
        document.addEventListener('click', (e) => this.handleClickOutside(e));
    }
    
    getCourses() {
        return [
            {
                title: "AI Websites & Automation",
                category: "Healthcare",
                keywords: ["ai", "websites", "automation", "healthcare", "business", "ai websites", "web development", "automation solutions"]
            }
        ];
    }
    
    handleInput(e, type) {
        const query = e.target.value.toLowerCase().trim();
        const input = type === 'desktop' ? this.desktopInput : this.mobileInput;
        const suggestionsContainer = type === 'desktop' ? this.desktopSuggestions : this.mobileSuggestions;
        const clearBtn = type === 'desktop' ? this.desktopClearBtn : this.mobileClearBtn;
        
        if (clearBtn) {
            clearBtn.style.display = query ? 'flex' : 'none';
        }
        
        if (!query) {
            this.hideSuggestions(type);
            return;
        }
        
        const matches = this.findMatches(query);
        
        if (matches.length > 0) {
            this.showSuggestions(matches, type);
        } else {
            this.hideSuggestions(type);
        }
        
        this.currentFocus = -1;
    }
    
    findMatches(query) {
        const matches = [];
        const seen = new Set();
        
        this.courses.forEach(course => {
            const titleMatch = course.title.toLowerCase().includes(query);
            const categoryMatch = course.category.toLowerCase().includes(query);
            const keywordMatch = course.keywords.some(kw => kw.includes(query));
            
            if (titleMatch && !seen.has(course.title)) {
                matches.push({
                    text: course.title,
                    type: 'course',
                    highlight: query
                });
                seen.add(course.title);
            }
            
            if (categoryMatch && !seen.has(course.category)) {
                matches.push({
                    text: course.category,
                    type: 'category',
                    highlight: query
                });
                seen.add(course.category);
            }
            
            course.keywords.forEach(keyword => {
                if (keyword.includes(query) && !seen.has(keyword) && matches.length < 8) {
                    matches.push({
                        text: keyword,
                        type: 'keyword',
                        highlight: query
                    });
                    seen.add(keyword);
                }
            });
        });
        
        return matches.slice(0, 8);
    }
    
    showSuggestions(matches, type) {
        const container = type === 'desktop' ? this.desktopSuggestions : this.mobileSuggestions;
        
        container.innerHTML = matches.map((match, index) => {
            const icon = this.getIcon(match.type);
            const highlightedText = this.highlightMatch(match.text, match.highlight);
            
            return `
                <div class="suggestion-item" data-index="${index}" data-value="${match.text}" data-type="${type}">
                    ${icon}
                    <span class="suggestion-text">${highlightedText}</span>
                </div>
            `;
        }).join('');
        
        container.style.display = 'block';
        
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => this.selectSuggestion(item, type));
        });
    }
    
    hideSuggestions(type) {
        const container = type === 'desktop' ? this.desktopSuggestions : this.mobileSuggestions;
        container.style.display = 'none';
        container.innerHTML = '';
    }
    
    getIcon(type) {
        const icons = {
            course: `<svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>`,
            category: `<svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>`,
            keyword: `<svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>`
        };
        return icons[type] || icons.keyword;
    }
    
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
    
    selectSuggestion(item, type) {
        const value = item.dataset.value;
        const input = type === 'desktop' ? this.desktopInput : this.mobileInput;
        
        input.value = value;
        this.hideSuggestions(type);
        
        const clearBtn = type === 'desktop' ? this.desktopClearBtn : this.mobileClearBtn;
        if (clearBtn) {
            clearBtn.style.display = 'flex';
        }
        
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
    }
    
    handleKeyDown(e, type) {
        const container = type === 'desktop' ? this.desktopSuggestions : this.mobileSuggestions;
        const items = container.querySelectorAll('.suggestion-item');
        
        if (!items.length) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.currentFocus++;
            if (this.currentFocus >= items.length) this.currentFocus = 0;
            this.setActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.currentFocus--;
            if (this.currentFocus < 0) this.currentFocus = items.length - 1;
            this.setActive(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.currentFocus > -1 && items[this.currentFocus]) {
                this.selectSuggestion(items[this.currentFocus], type);
            } else {
                this.hideSuggestions(type);
            }
        } else if (e.key === 'Escape') {
            this.hideSuggestions(type);
        }
    }
    
    setActive(items) {
        items.forEach((item, index) => {
            if (index === this.currentFocus) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    clearSearch(type) {
        const input = type === 'desktop' ? this.desktopInput : this.mobileInput;
        const clearBtn = type === 'desktop' ? this.desktopClearBtn : this.mobileClearBtn;
        
        input.value = '';
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        this.hideSuggestions(type);
        
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
        
        input.focus();
    }
    
    handleClickOutside(e) {
        // Only handle header search, not marketplace search
        if (!e.target.closest('.header-search-bar') && !e.target.closest('.mobile-search-bar')) {
            this.hideSuggestions('desktop');
            this.hideSuggestions('mobile');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SearchAutocomplete();
});

