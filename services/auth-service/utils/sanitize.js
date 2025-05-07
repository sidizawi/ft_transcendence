function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}
  
export const XSSanitizer = (body) => {
    if (!body || typeof body !== 'object') return body;
    
    const sanitizedBody = {};
    
    for (const key in body) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        if (typeof body[key] === 'string') {
          sanitizedBody[key] = sanitizeInput(body[key]);
        } else {
          sanitizedBody[key] = body[key];
        }
      }
    }
    
    return sanitizedBody;
}
