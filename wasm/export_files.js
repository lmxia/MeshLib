// Export files functionality for WASM MeshViewer
(function() {
    'use strict';

    // Export file function - 使用封装的 C++ 函数
    function exportFile() {
        if (typeof Module === 'undefined' || !Module.ccall) {
            console.error('Module not available');
            return;
        }

        try {
            // 直接调用封装的 C++ 函数
            // 这个函数会自动处理对象选择和对话框显示
            var result = Module.ccall('emsSaveSelectedObjects', 'boolean', [], []);
            
            // C++ 函数返回 false 是正常的（表示异步操作开始）
            // 如果返回 true 可能表示有错误
            if (result) {
                console.warn('Save operation may have encountered an issue');
            }
        } catch (error) {
            console.error('Error calling save function:', error);
            alert('导出失败: ' + error.message);
        }
    }

    // Initialize export button when DOM is ready
    function initExportButton() {
        var exportBtn = document.getElementById('export-file-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportFile);
        }
    }

    // Ensure the button is initialized after the DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExportButton);
    } else {
        initExportButton();
    }
})();