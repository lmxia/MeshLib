// Scene Control functionality for WASM MeshViewer
(function() {
    'use strict';

    let updateInterval = null;
    let isUpdating = false;

    // 获取场景对象列表
    function getSceneObjects() {
        if (typeof Module === 'undefined' || !Module.ccall) {
            return [];
        }

        try {
            const objectsJson = Module.ccall('emsGetSceneObjects', 'string', [], []);
            if (!objectsJson || objectsJson === '[]') {
                return [];
            }
            return JSON.parse(objectsJson);
        } catch (error) {
            console.error('Error getting scene objects:', error);
            return [];
        }
    }

    // 选择/取消选择对象
    function selectObject(objectName, selected) {
        if (typeof Module === 'undefined' || !Module.ccall) {
            console.error('Module not available');
            return;
        }

        try {
            Module.ccall('emsSelectObject', 'void', ['string', 'boolean'], [objectName, selected]);
        } catch (error) {
            console.error('Error selecting object:', error);
        }
    }

    // 设置对象可见性
    function setObjectVisibility(objectName, visible) {
        if (typeof Module === 'undefined' || !Module.ccall) {
            console.error('Module not available');
            return;
        }

        try {
            Module.ccall('emsSetObjectVisibility', 'void', ['string', 'boolean'], [objectName, visible]);
        } catch (error) {
            console.error('Error setting object visibility:', error);
        }
    }

    // 删除对象
    function deleteObject(objectName) {
        if (typeof Module === 'undefined' || !Module.ccall) {
            console.error('Module not available');
            return;
        }

        if (!confirm('确定要删除对象 "' + objectName + '" 吗？')) {
            return;
        }

        try {
            Module.ccall('emsDeleteObject', 'void', ['string'], [objectName]);
        } catch (error) {
            console.error('Error deleting object:', error);
        }
    }

    // 更新场景列表显示
    function updateSceneList() {
        if (isUpdating) return;
        isUpdating = true;

        const objects = getSceneObjects();
        const listContainer = document.getElementById('scene-list');
        
        if (!listContainer) {
            isUpdating = false;
            return;
        }

        // 清空现有内容
        listContainer.innerHTML = '';

        if (objects.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'scene-item';
            emptyItem.innerHTML = '<span style="color: #95a5a6; font-style: italic;">暂无对象</span>';
            listContainer.appendChild(emptyItem);
            isUpdating = false;
            return;
        }

        // 创建对象列表项
        objects.forEach(obj => {
            const item = document.createElement('div');
            item.className = `scene-item ${obj.selected ? 'selected' : ''}`;
            
            item.innerHTML = `
                <input type="checkbox" ${obj.visible ? 'checked' : ''} 
                       onchange="sceneControl.setObjectVisibility('${obj.name}', this.checked)">
                <span class="object-name" onclick="sceneControl.selectObject('${obj.name}', !${obj.selected})">${obj.name}</span>
                <button class="delete-btn" onclick="sceneControl.deleteObject('${obj.name}')">删除</button>
            `;
            
            listContainer.appendChild(item);
        });

        isUpdating = false;
    }

    // 开始自动更新
    function startAutoUpdate() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        
        // 每500ms更新一次场景列表
        updateInterval = setInterval(updateSceneList, 500);
        
        // 立即更新一次
        updateSceneList();
    }

    // 停止自动更新
    function stopAutoUpdate() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    // 初始化场景控制（在 Emscripten 运行时就绪后调用）
    function initSceneControl() {
        console.log('Scene control initialized');
        startAutoUpdate();
    }

    // 导出公共接口
    window.sceneControl = {
        getSceneObjects: getSceneObjects,
        selectObject: selectObject,
        setObjectVisibility: setObjectVisibility,
        deleteObject: deleteObject,
        updateSceneList: updateSceneList,
        startAutoUpdate: startAutoUpdate,
        stopAutoUpdate: stopAutoUpdate,
        init: initSceneControl
    };

    // 将初始化挂到 Emscripten 的运行时回调，尽量少改动原有 JS：
    (function attachInit() {
        // 如果 Module 已存在并支持 postRun，使用 postRun
        if (typeof Module !== 'undefined' && Module) {
            if (Array.isArray(Module.postRun)) {
                Module.postRun.push(initSceneControl);
                return;
            }
            // 退化到 onRuntimeInitialized
            if (!Module.onRuntimeInitialized) {
                Module.onRuntimeInitialized = initSceneControl;
                return;
            }
        }
        // 如果此时 Module 还不可用，等到页面加载后再尝试一次，不做频繁轮询
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachInit, { once: true });
        } else {
            // 页面已就绪但 Module 还未注入，短暂延迟一次再试
            setTimeout(attachInit, 50);
        }
    })();

    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        stopAutoUpdate();
    });

})();
