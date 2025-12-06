// Marketplace Search Autocomplete Module
// Handles marketplace search input, dropdown suggestions, and keyboard navigation

(function() {
    const marketplaceInput = document.getElementById('marketplaceSearch');
    const marketplaceDropdown = document.getElementById('marketplaceSearchDropdown');
    const marketplaceSuggestions = document.getElementById('marketplaceSearchSuggestions');
    
    if (!marketplaceInput || !marketplaceDropdown || !marketplaceSuggestions) return;
    
    let currentFocus = -1;
    
    marketplaceInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (!query) {
            marketplaceDropdown.style.display = 'none';
            marketplaceSuggestions.innerHTML = '';
            return;
        }
        
        // Get courses from window.marketplace if available
        const courses = window.marketplace?.courses || [];
        const matches = [];
        
        courses.forEach(course => {
            const title = (course.title || '').toLowerCase();
            const category = (course.category || '').toLowerCase();
            
            if (title.includes(query) || category.includes(query)) {
                matches.push({
                    title: course.title,
                    category: course.category,
                    id: course.id
                });
            }
        });
        
        if (matches.length > 0) {
            showMarketplaceSuggestions(matches.slice(0, 6), query);
        } else {
            marketplaceDropdown.style.display = 'none';
            marketplaceSuggestions.innerHTML = '';
        }
    });
    
    function showMarketplaceSuggestions(matches, query) {
        const html = matches.map((match, index) => {
            const highlightedTitle = highlightText(match.title, query);
            return `
                <div class="suggestion-item" data-index="${index}" data-course-id="${match.id}">
                    <span class="suggestion-text">${highlightedTitle}</span>
                </div>
            `;
        }).join('');
        
        marketplaceSuggestions.innerHTML = html;
        marketplaceDropdown.style.display = 'block';
        
        // Add click handlers
        marketplaceSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
                const courseId = this.dataset.courseId;
                marketplaceInput.value = this.querySelector('.suggestion-text').textContent;
                marketplaceDropdown.style.display = 'none';
                // Trigger search/filter
                if (window.marketplace && window.marketplace.handleSearch) {
                    window.marketplace.handleSearch(marketplaceInput.value);
                }
            });
        });
    }
    
    function highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
    
    // Close dropdown on click outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#marketplaceSearchWrapper')) {
            marketplaceDropdown.style.display = 'none';
        }
    });
    
    // Keyboard navigation
    marketplaceInput.addEventListener('keydown', function(e) {
        const items = marketplaceSuggestions.querySelectorAll('.suggestion-item');
        
        if (!items.length) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            if (currentFocus >= items.length) currentFocus = 0;
            setActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            if (currentFocus < 0) currentFocus = items.length - 1;
            setActive(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1 && items[currentFocus]) {
                items[currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            marketplaceDropdown.style.display = 'none';
        }
    });
    
    function setActive(items) {
        items.forEach((item, index) => {
            if (index === currentFocus) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
})();

