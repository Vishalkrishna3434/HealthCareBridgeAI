/**
 * Simple retry wrapper for fetch calls
 * @param {string} url 
 * @param {object} options 
 * @param {number} retries 
 * @param {number} backoff 
 */
export const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 1000) => {
    try {
        const response = await fetch(url, options)
        if (!response.ok && retries > 0) {
            throw new Error(`Status ${response.status}`)
        }
        return response
    } catch (err) {
        if (retries > 0) {
            console.warn(`Fetch failed, retrying in ${backoff}ms... (${retries} left)`, err)
            await new Promise(resolve => setTimeout(resolve, backoff))
            return fetchWithRetry(url, options, retries - 1, backoff * 2)
        }
        throw err
    }
}
