// Panel resize functionality
(function() {
    'use strict';

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let panel = null;
    let resizeHandle = null;

    function initPanelResize() {
        panel = document.getElementById('scene-panel');
        resizeHandle = document.getElementById('panel-resize-handle');

        if (!panel || !resizeHandle) {
            console.warn('Panel resize: Required elements not found');
            return;
        }

        // Mouse events for resize handle
        resizeHandle.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);

        // Touch events for mobile support
        resizeHandle.addEventListener('touchstart', startResizeTouch);
        document.addEventListener('touchmove', doResizeTouch);
        document.addEventListener('touchend', stopResize);

        console.log('Panel resize initialized');
    }

    function startResize(e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(window.getComputedStyle(panel).width, 10);
        
        // Prevent text selection during resize
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        
        e.preventDefault();
    }

    function startResizeTouch(e) {
        if (e.touches.length === 1) {
            isResizing = true;
            startX = e.touches[0].clientX;
            startWidth = parseInt(window.getComputedStyle(panel).width, 10);
            
            e.preventDefault();
        }
    }

    function doResize(e) {
        if (!isResizing) return;

        const newWidth = startWidth + (e.clientX - startX);
        const minWidth = 200;
        const maxWidth = 500;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            panel.style.width = newWidth + 'px';
        }

        e.preventDefault();
    }

    function doResizeTouch(e) {
        if (!isResizing || e.touches.length !== 1) return;

        const newWidth = startWidth + (e.touches[0].clientX - startX);
        const minWidth = 200;
        const maxWidth = 500;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            panel.style.width = newWidth + 'px';
        }

        e.preventDefault();
    }

    function stopResize() {
        if (!isResizing) return;

        isResizing = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPanelResize);
    } else {
        initPanelResize();
    }

    // Expose for manual initialization if needed
    window.initPanelResize = initPanelResize;

})();
