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

    // 保存单个对象
    function saveObject(objectName) {
        if (typeof Module === 'undefined' || !Module.ccall) {
            console.error('Module not available');
            return;
        }

        try {
            // 先选择对象，然后保存
            Module.ccall('emsSelectObject', 'void', ['string', 'boolean'], [objectName, true]);
            Module.ccall('emsSaveSelectedObjects', 'boolean', [], []);
        } catch (error) {
            console.error('Error saving object:', error);
        }
    }

    // 适应单个对象到视图
    function fitObject(objectName) {
        if (typeof Module === 'undefined' || !Module.ccall) {
            console.error('Module not available');
            return;
        }

        try {
            // 先选择对象，然后适应视图
            Module.ccall('emsSelectObject', 'void', ['string', 'boolean'], [objectName, true]);
            // 使用emsFitScene来适应选中的对象
            Module.ccall('emsFitScene', 'void', [], []);
        } catch (error) {
            console.error('Error fitting object:', error);
        }
    }

    // 居中显示对象
    function centerObject(objectName) {
        if (typeof Module === 'undefined' || !Module.ccall) {
            console.error('Module not available');
            return;
        }

        try {
            // 先选择对象，然后居中
            Module.ccall('emsSelectObject', 'void', ['string', 'boolean'], [objectName, true]);
            // 使用emsFitScene来居中选中的对象
            Module.ccall('emsFitScene', 'void', [], []);
        } catch (error) {
            console.error('Error centering object:', error);
        }
    }


    // 显示对象信息
    function showObjectInfo(objectName) {
        const objects = getSceneObjects();
        const obj = objects.find(o => o.name === objectName);
        
        if (obj) {
            const info = `对象名称: ${obj.name}\n类型: ${obj.type}\n可见性: ${obj.visible ? '可见' : '隐藏'}\n选中状态: ${obj.selected ? '已选中' : '未选中'}`;
            alert(info);
        }
    }

    // 保存所有对象
    function saveAllObjects() {
        if (typeof Module === 'undefined' || !Module.ccall) {
            console.error('Module not available');
            return;
        }

        try {
            const objects = getSceneObjects();
            if (objects.length === 0) {
                alert('场景中没有对象可保存');
                return;
            }

            // 选择所有对象
            objects.forEach(obj => {
                Module.ccall('emsSelectObject', 'void', ['string', 'boolean'], [obj.name, true]);
            });

            // 保存选中的对象
            Module.ccall('emsSaveSelectedObjects', 'boolean', [], []);
        } catch (error) {
            console.error('Error saving all objects:', error);
        }
    }

    // 清空所有对象
    function clearAllObjects() {
        if (!confirm('确定要清空场景中的所有对象吗？此操作不可撤销。')) {
            return;
        }

        try {
            const objects = getSceneObjects();
            objects.forEach(obj => {
                Module.ccall('emsDeleteObject', 'void', ['string'], [obj.name]);
            });
        } catch (error) {
            console.error('Error clearing all objects:', error);
        }
    }

    // 适应整个场景
    function fitScene() {
        if (typeof Module === 'undefined' || !Module.ccall) {
            console.error('Module not available');
            return;
        }

        try {
            Module.ccall('emsFitScene', 'void', [], []);
        } catch (error) {
            console.error('Error fitting scene:', error);
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
                <span class="object-name" onclick="sceneControl.selectObject('${obj.name}', !${obj.selected})" title="点击选择/取消选择">${obj.name}</span>
                <div class="action-buttons">
                    <button class="action-btn visibility-btn ${obj.visible ? 'visible' : 'hidden'}" 
                            onclick="sceneControl.setObjectVisibility('${obj.name}', !${obj.visible})" 
                            title="${obj.visible ? '隐藏对象' : '显示对象'}">
                        ${obj.visible ? '👁️' : '🙈'}
                    </button>
                    <button class="action-btn fit-btn" onclick="sceneControl.fitObject('${obj.name}')" title="适应视图">适应</button>
                    <button class="action-btn center-btn" onclick="sceneControl.centerObject('${obj.name}')" title="居中显示">居中</button>
                    <button class="action-btn info-btn" onclick="sceneControl.showObjectInfo('${obj.name}')" title="显示信息">信息</button>
                    <button class="action-btn delete-btn" onclick="sceneControl.deleteObject('${obj.name}')" title="删除对象">删除</button>
                </div>
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
        fitObject: fitObject,
        centerObject: centerObject,
        showObjectInfo: showObjectInfo,
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
