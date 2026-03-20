/**
 * Checks if a URL points to an image or video based on its extension.
 * @param {string} url - The URL to check.
 * @returns {string} - "image", "video", or "unknown".
 */
export const isImageOrVideo = (url) => {
    if (!url) return "unknown";
    const ext = url.split(".").pop().toLowerCase();
    const images = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "tiff"];
    const videos = ["mp4", "mov", "avi", "mkv", "flv", "wmv", "webm", "m4v"];
    
    if (images.includes(ext)) return "image";
    if (videos.includes(ext)) return "video";
    return "unknown";
};

/**
 * Formats a number into a shorter string (e.g., 1k, 1M, 1B).
 * @param {number} num - The number to format.
 * @returns {string} - The formatted string.
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return num.toString();
};
