/**
 * Cross-domain cookie authentication utility
 * Sets cookies for .nuerlo.com domain to enable cross-subdomain authentication
 */

const COOKIE_NAME = 'nuerlo_session';
const COOKIE_DOMAIN = '.nuerlo.com';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Set the authentication cookie with Firebase ID token
 * @param {string} token - Firebase ID token (JWT)
 * @param {number} maxAge - Cookie expiration in seconds (default: 30 days)
 */
export function setAuthCookie(token, maxAge = COOKIE_MAX_AGE) {
    if (!token) {
        console.error('Cannot set auth cookie: token is required');
        return;
    }

    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + (maxAge * 1000));

    // Build cookie string for token
    // Domain=.nuerlo.com - accessible from all subdomains
    // Secure=true - HTTPS only
    // HttpOnly=false - allow JavaScript access
    // SameSite=Lax - CSRF protection
    const cookieString = [
        `${COOKIE_NAME}=${encodeURIComponent(token)}`,
        `domain=${COOKIE_DOMAIN}`,
        `path=/`,
        `max-age=${maxAge}`,
        `expires=${expirationDate.toUTCString()}`,
        `Secure`,
        `SameSite=Lax`
    ].join('; ');

    // Set the token cookie
    document.cookie = cookieString;
    
    // Also set a simple boolean cookie for the main site to check
    // This is what nuerlo.com checks for to show "Dashboard" instead of "Sign In"
    // Try multiple approaches to ensure cookie is set
    
    // Method 1: With Secure flag (for HTTPS)
    const booleanCookieString = [
        `nuerlo_authenticated=true`,
        `domain=${COOKIE_DOMAIN}`,
        `path=/`,
        `max-age=${maxAge}`,
        `expires=${expirationDate.toUTCString()}`,
        `Secure`,
        `SameSite=None`
    ].join('; ');
    
    document.cookie = booleanCookieString;
    
    // Method 2: Also try without Secure flag (in case of HTTP or browser restrictions)
    const booleanCookieStringNoSecure = [
        `nuerlo_authenticated=true`,
        `domain=${COOKIE_DOMAIN}`,
        `path=/`,
        `max-age=${maxAge}`,
        `expires=${expirationDate.toUTCString()}`,
        `SameSite=Lax`
    ].join('; ');
    
    document.cookie = booleanCookieStringNoSecure;
    
    // Method 3: Also set on current domain as fallback
    const booleanCookieStringLocal = [
        `nuerlo_authenticated=true`,
        `path=/`,
        `max-age=${maxAge}`,
        `expires=${expirationDate.toUTCString()}`,
        `SameSite=Lax`
    ].join('; ');
    
    document.cookie = booleanCookieStringLocal;
    
    // Verify the cookie was set by trying to read it back
    setTimeout(() => {
        const verifyCookie = document.cookie.split(';').find(c => c.trim().startsWith('nuerlo_authenticated='));
        if (verifyCookie) {
            console.log('✓ nuerlo_authenticated cookie verified:', verifyCookie);
        } else {
            console.warn('⚠ nuerlo_authenticated cookie not found after setting. Current cookies:', document.cookie);
            console.warn('Current domain:', window.location.hostname);
        }
    }, 100);
    
    console.log('Auth cookies set successfully for domain:', COOKIE_DOMAIN);
}

/**
 * Get the authentication cookie value
 * @returns {string|null} The cookie value or null if not found
 */
export function getAuthCookie() {
    const name = COOKIE_NAME + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(name) === 0) {
            return decodeURIComponent(cookie.substring(name.length));
        }
    }

    return null;
}

/**
 * Clear the authentication cookie
 */
export function clearAuthCookie() {
    // Set cookie with expiration in the past to delete it
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() - 86400000); // 1 day ago

    // Clear the token cookie
    const cookieString = [
        `${COOKIE_NAME}=`,
        `domain=${COOKIE_DOMAIN}`,
        `path=/`,
        `max-age=0`,
        `expires=${expirationDate.toUTCString()}`,
        `Secure`,
        `SameSite=Lax`
    ].join('; ');

    document.cookie = cookieString;
    
    // Also clear the boolean authentication cookie
    const booleanCookieString = [
        `nuerlo_authenticated=`,
        `domain=${COOKIE_DOMAIN}`,
        `path=/`,
        `max-age=0`,
        `expires=${expirationDate.toUTCString()}`,
        `Secure`,
        `SameSite=Lax`
    ].join('; ');
    
    document.cookie = booleanCookieString;
    
    console.log('Auth cookies cleared successfully');
}

/**
 * Check if the auth cookie exists
 * @returns {boolean} True if cookie exists
 */
export function hasAuthCookie() {
    return getAuthCookie() !== null;
}

