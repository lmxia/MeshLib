var pointerSize = 0;

var getPointerSize = function () {
  if (!pointerSize) {
    pointerSize = Module.ccall('emsGetPointerSize', 'number', [], []);
  }
  return pointerSize;
}

var toPointer = function (value) {
  return getPointerSize() == 8 ? BigInt(value) : value;
}

var freeFSCallback = function () {
  Module.ccall('emsFreeFSCallback', 'void', [], []);
}

var open_files_dialog_popup = function (extensions, multi) {
  var labelString = multi ? "Select Files" : "Select File";
  var { overlay, popup } = createOverlayPopup('show_browse_dialog', labelString, 400, 150, true, true, freeFSCallback);

  var file_selector_label = document.createElement('label');
  file_selector_label.setAttribute('for', 'FileSelectorTag');
  file_selector_label.setAttribute('style', 'position:absolute;top:50%;left:50%;transform:translate(-50%,50%);width: 120px;  height: 28px; border-radius: 4px;');
  file_selector_label.setAttribute('class', 'button');

  var file_selector_label_text = document.createElement('div');
  file_selector_label_text.innerHTML = "Browse...";
  file_selector_label_text.setAttribute('class', 'unselectable');
  file_selector_label_text.setAttribute('style', 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size: 14px;  font-weight: 600;  font-stretch: normal;  font-style: normal;  line-height: normal;  letter-spacing: normal;  text-align: center;  color: #fff;');

  var file_selector = document.createElement('input');
  file_selector.setAttribute('type', 'file');
  file_selector.setAttribute('id', 'FileSelectorTag');
  if (multi)
    file_selector.setAttribute('multiple', null);
  file_selector.setAttribute('onchange', 'open_files(event)');
  if (!is_ios())
    file_selector.setAttribute('accept', extensions);
  file_selector.setAttribute('style', 'display: none;');
  file_selector.setAttribute('align', 'center');

  file_selector_label.appendChild(file_selector_label_text);
  file_selector_label.appendChild(file_selector);

  popup.appendChild(file_selector_label);
  overlay.appendChild(popup);

  removeKeyboardEvents();
  document.body.appendChild(overlay);
}

var download_file_dialog_popup = function (defaultName, extensions) {
  var isLightThemeEnabled = getColorTheme();
  var { overlay, popup } = createOverlayPopup('show_download_dialog', "保存文件", 440, 232, true, true, freeFSCallback);

  var textColor = isLightThemeEnabled ? '#181a1d' : '#fff';
  var bgColor = isLightThemeEnabled ? '#f5f6f9' : '#000';
  var name_label = document.createElement('label');
  name_label.setAttribute('style', 'width: 144px;height: 20px;position: absolute;top: 86px;left: 62px;margin-left: 0px;font-size: 14px;color:' + textColor);
  name_label.innerHTML = '名称';
  name_label.setAttribute('class', 'unselectable');

  var name_selector = document.createElement('input');
  name_selector.setAttribute('type', 'text');
  name_selector.setAttribute('id', 'download_name');
  name_selector.setAttribute('style', 'position: absolute;top: 81px;left: 50%;transform: translate(-50%, 0px);background-color:' + bgColor + ';border-radius: 4px;width: 198px;height: 26px;border: solid 1px #5f6369;color:' + textColor + ';padding: 0px 0px;');

  name_selector.value = defaultName || "Unnamed";

  var ext_label = document.createElement('label');
  ext_label.setAttribute('style', 'width: 59px;height: 20px;font-size: 14px;position: absolute;color:' + textColor + ';top: 131px;left: 38px;');
  ext_label.innerHTML = '扩展名';
  ext_label.setAttribute('class', 'unselectable');

  var list_item = document.createElement('select');
  list_item.setAttribute('id', 'download_ext');
  list_item.setAttribute('style', 'position: absolute;top: 125px;left: 50%;transform: translate(-50%, 0px);background-color:' + bgColor + ';border-radius: 4px;width: 200px;height: 28px;border: solid 1px #5f6369;color:' + textColor + ';padding: 0px 0px;');
  var splitExt = extensions.split(', ');
  for (var i = 0; i < splitExt.length; i++) {
    var option_el = document.createElement('option');
    option_el.setAttribute('value', splitExt[i]);
    option_el.innerHTML = splitExt[i];
    option_el.setAttribute('class', 'unselectable');
    list_item.appendChild(option_el);
  }

  var btn_save = document.createElement('input');
  btn_save.setAttribute('type', 'button');
  btn_save.setAttribute('value', '保存');
  btn_save.setAttribute('style', 'position: absolute;width: 100px;height: 28px;top: 194px;left: 50%;transform: translate(-50%, -50%);border-radius: 4px;color: #fff;font-size: 14px;font-weight: 600;border: none;');
  btn_save.setAttribute('class', 'button');
  btn_save.onclick = function () {
    Module.ccall('emsSaveFile', 'number', ['string'], [document.getElementById('download_name').value + document.getElementById('download_ext').value]);
    addKeyboardEvents();
    document.getElementById('show_download_dialog').remove();
  };

  popup.appendChild(name_label);
  popup.appendChild(name_selector);
  popup.appendChild(ext_label);
  popup.appendChild(list_item);
  popup.appendChild(btn_save);

  removeKeyboardEvents();
  document.body.appendChild(overlay);

  name_selector.focus();
  name_selector.select();
  name_selector.addEventListener('keydown', function (ev) {
    if (ev.key == 'Enter' && name_selector.value) {
      ev.preventDefault();
      btn_save.click();
    }
  });
}

var open_directory_dialog_popup = function () {
  var { overlay, popup } = createOverlayPopup('show_browse_dialog', "Select Directory", 400, 150, true, true, freeFSCallback);
  var file_selector_label = document.createElement('label');
  file_selector_label.setAttribute('for', 'FileSelectorTag');
  file_selector_label.setAttribute('style', 'position:absolute;top:50%;left:50%;transform:translate(-50%,50%);width: 120px;  height: 28px; border-radius: 4px;');
  file_selector_label.setAttribute('class', 'button');

  var file_selector_label_text = document.createElement('div');
  file_selector_label_text.innerHTML = "Browse...";
  file_selector_label_text.setAttribute('class', 'unselectable');
  file_selector_label_text.setAttribute('style', 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size: 14px;  font-weight: 600;  font-stretch: normal;  font-style: normal;  line-height: normal;  letter-spacing: normal;  text-align: center;  color: #fff;');

  var file_selector = document.createElement('input');
  file_selector.setAttribute('type', 'file');
  file_selector.setAttribute('id', 'FileSelectorTag');
  file_selector.setAttribute('directory', null);
  file_selector.setAttribute('mozdirectory', null);
  file_selector.setAttribute('webkitdirectory', null);
  file_selector.setAttribute('onchange', 'open_dir(event)');
  file_selector.setAttribute('style', 'display: none;');
  file_selector.setAttribute('align', 'center');

  file_selector_label.appendChild(file_selector_label_text);
  file_selector_label.appendChild(file_selector);

  popup.appendChild(file_selector_label);
  overlay.appendChild(popup);

  removeKeyboardEvents();
  document.body.appendChild(overlay);
}

var open_files = function (e) {
  if (!GLFW.active) {
    addKeyboardEvents();
    document.getElementById('show_browse_dialog').remove();
    return;
  }
  if (!e.target || !e.target.files || e.target.files.length == 0) {
    addKeyboardEvents();
    document.getElementById('show_browse_dialog').remove();
    return;
  }
  e.preventDefault();
  var filenames = _malloc(e.target.files.length * getPointerSize());
  var filenamesArray = [];
  var count = e.target.files.length;
  var written = 0;
  var drop_dir = ".use_open_files";
  FS.createPath("/", drop_dir);
  function save(file) {
    var path = "/" + drop_dir + "/" + file.name.replace(/\//g, "_");
    var reader = new FileReader();
    reader.onloadend = e => {
      if (reader.readyState != 2) {
        ++written;
        out("failed to read opened file: " + file.name + ": " + reader.error);
        return;
      }
      var data = e.target.result;
      FS.writeFile(path, new Uint8Array(data));
      if (++written === count) {
        Module.ccall('emsOpenFiles', 'number', ['number', 'Int8Array'], [count, toPointer(filenames)]);
        for (var i = 0; i < filenamesArray.length; ++i) {
          _free(filenamesArray[i]);
        }
        _free(filenames);
      }
      // enforce several frames to toggle animation when popup closed
      for (var i = 0; i < 500; i += 100)
        setTimeout(function () { Module.ccall('emsPostEmptyEvent', 'void', ['number'], [1]); }, i);
    };
    reader.readAsArrayBuffer(file);
    var filename = stringToNewUTF8(path);
    filenamesArray.push(filename);
    if (getPointerSize() == 8)
      HEAPU64[(filenames + i * 8) / 8] = BigInt(filename);
    else if (typeof GROWABLE_HEAP_U32 !== 'undefined')
      GROWABLE_HEAP_U32()[filenames + i * 4 >> 2] = filename;
    else
      HEAP32[filenames + i * 4 >> 2] = filename;
  }
  for (var i = 0; i < count; ++i) {
    save(e.target.files[i]);
  }
  addKeyboardEvents();
  document.getElementById('show_browse_dialog').remove();
  return false;
};

var prevSize = 0;
var save_file = function (filename) {
  var checkPath = function (filename) {
    if (!FS.analyzePath(filename).exists) {
      setTimeout(() => {
        checkPath(filename);
      }, 200);
      return;
    }
    var size = FS.stat(filename).size;
    if (size === 0 || size !== prevSize || Module.ccall('emsIsProgressBarOrdered', 'bool', [], [])) {
      prevSize = size;
      setTimeout(() => {
        checkPath(filename);
      }, 200);
      return;
    }
    let content = FS.readFile(filename);

    var a = document.createElement('a');
    a.download = filename;
    var mime = "application/octet-stream";
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 0);
  };
  prevSize = 0;
  checkPath(filename);
};

var open_dir = function (e) {
  if (!GLFW.active) {
    addKeyboardEvents();
    document.getElementById('show_browse_dialog').remove();
    return;
  }
  if (!e.target || !e.target.files || e.target.files.length == 0) {
    addKeyboardEvents();
    document.getElementById('show_browse_dialog').remove();
    return;
  }
  e.preventDefault();

  var drop_dir = ".use_open_files";
  FS.createPath("/", drop_dir);

  var root_dir_name = "";
  var written = 0;
  const files = e.target.files;
  function save(file) {
    const file_path = file.webkitRelativePath;
    const dir_path = file_path.substring(0, file_path.lastIndexOf('/'));
    if (root_dir_name === "") {
      root_dir_name = file_path.substring(0, file_path.indexOf('/'));
    }

    var reader = new FileReader();
    reader.onloadend = e => {
      if (reader.readyState != 2) {
        ++written;
        out("failed to read opened file: " + file.name + ": " + reader.error);
        return;
      }

      var data = e.target.result;
      FS.createPath("/" + drop_dir, dir_path);
      FS.writeFile(`/${drop_dir}/${file_path}`, new Uint8Array(data));

      if (++written === files.length) {
        Module.ccall('emsOpenDirectory', 'number', ['string'], [`/${drop_dir}/${root_dir_name}`]);
      }

      // enforce several frames to toggle animation when popup closed
      for (var i = 0; i < 500; i += 100)
        setTimeout(function () { Module.ccall('emsPostEmptyEvent', 'void', ['number'], [1]); }, i);
    };
    reader.readAsArrayBuffer(file);
  }
  for (const file of files) {
    save(file);
  }

  addKeyboardEvents();
  document.getElementById('show_browse_dialog').remove();
  return false;
};

var emplace_file_in_local_FS_and_open_context_id = 0;
var emplace_file_in_local_FS_and_open_notifier = {};
var emplace_file_in_local_FS_and_open = function (name_with_ext, bytes, callback = function (objHierarchyJSONString) {}) {
  var directory = ".use_open_files";
  FS.createPath("/", directory);
  var path = "/" + directory + "/" + name_with_ext.replace(/\//g, "_");
  FS.writeFile(path, bytes);

  emplace_file_in_local_FS_and_open_notifier[emplace_file_in_local_FS_and_open_context_id] = callback;
  Module.ccall('emsAddFileToScene', 'void', ['string', 'number'], [path, emplace_file_in_local_FS_and_open_context_id]);
  emplace_file_in_local_FS_and_open_context_id = emplace_file_in_local_FS_and_open_context_id + 1;

  // enforce several frames to toggle animation when popup closed
  for (var i = 0; i < 500; i += 100)
    setTimeout(function () { Module.ccall('emsPostEmptyEvent', 'void', ['number'], [1]); }, i);
}

var get_object_data_from_scene = function (object_name, temp_filename_with_ext) {
  Module.ccall('emsGetObjectFromScene', 'void', ['string', 'string'], [object_name, temp_filename_with_ext]);
  if (!FS.analyzePath(temp_filename_with_ext).exists)
    return;
  return FS.readFile(temp_filename_with_ext);
}

var test_download_file = function (url) {
  var options = {
    method: 'GET'
  };

  const controller = new AbortController();

  fetch(url, options).then(async (response) => {
    if (!response.ok || !response.body) {
      // nothing to process
      return response;
    }
    const contentEncoding = response.headers.get('content-encoding');
    const contentLength = response.headers.get(contentEncoding ? 'x-file-size' : 'content-length');
    if (contentLength === null) {
      return response;
    }
    const total = parseInt(contentLength, 10);
    if (total == 0) {
      return response;
    }

    let loaded = 0;
    return new Response(
      new ReadableStream({
        async start(controller) {
          const reader = response.body.getReader();
          for (; ;) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            loaded += value.byteLength;
            var v = loaded / total;
            console.log(v)
            controller.enqueue(value);
          }
          controller.close();
        }
      })
    );
  }).then(async (response) => {
    console.log(response);
    emplace_file_in_local_FS_and_open("downloadedFile.stl", new Uint8Array(await response.arrayBuffer()),(e)=>{ console.log(JSON.parse(e)); });
  });
}

// 导出文件：集成到本文件，供顶部按钮绑定调用
function exportFile() {
  if (typeof Module === 'undefined' || !Module.ccall) {
    console.error('Module not available');
    return;
  }
  try {
    var result = Module.ccall('emsSaveSelectedObjects', 'boolean', [], []);
    if (result) {
      console.warn('Save operation may have encountered an issue');
    }
  } catch (error) {
    console.error('Error calling save function:', error);
    alert('导出失败: ' + error.message);
  }
}
// 公开到全局命名空间（如已存在则覆盖为最新实现）
window.exportFile = exportFile;

// 绑定顶部按钮（增加健壮性：直到绑定成功为止，避免脚本加载顺序导致未绑定）
; (function bindTopButtons(){
  var attempts = 0;
  var timer = null;
  function tryBind(){
    attempts++;
    var openBtn = document.getElementById('open-file-btn');
    if (openBtn && !openBtn.__bound) {
      console.log('[ui] bind open-file-btn');
      openBtn.addEventListener('click', function(){
        var exts = '.stl,.obj,.ply,.glb,.gltf,.off,.ctm,.e57,.las,.laz,.mesh,.zip,.3mf';
        var canvas = document.getElementById('canvas');
        if (canvas && typeof canvas.focus === 'function') {
          try { canvas.focus(); } catch(e) {}
        }
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = exts;
        input.style.display = 'none';
        input.onchange = function(e){
          var f = e.target && e.target.files && e.target.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onloadend = function(ev){
            if (reader.readyState !== 2) return;
            if (typeof emplace_file_in_local_FS_and_open === 'function') {
              emplace_file_in_local_FS_and_open(f.name, new Uint8Array(ev.target.result));
            } else if (typeof open_files === 'function') {
              open_files(e);
            }
          };
          reader.readAsArrayBuffer(f);
        };
        document.body.appendChild(input);
        input.click();
        setTimeout(function(){ document.body.removeChild(input); }, 0);
      });
      openBtn.__bound = true;
    }
    var exportBtn = document.getElementById('export-file-btn');
    if (exportBtn && !exportBtn.__bound && typeof window.exportFile === 'function') {
      console.log('[ui] bind export-file-btn');
      exportBtn.addEventListener('click', function(){
        console.log('[ui] export-file-btn clicked');
        try { window.exportFile(); }
        catch(e){ console.error('[ui] exportFile error', e); }
      });
      exportBtn.__bound = true;
    }
    // 若两个都已绑定，或尝试多次后停止
    if ((openBtn && openBtn.__bound) && (exportBtn && exportBtn.__bound)) {
      if (timer) clearInterval(timer);
      timer = null;
    } else if (attempts >= 50) { // 最多重试 ~5秒（100ms * 50）
      if (timer) clearInterval(timer);
      timer = null;
      if (!(openBtn && openBtn.__bound)) console.warn('[ui] open-file-btn not bound after retries');
      if (!(exportBtn && exportBtn.__bound)) console.warn('[ui] export-file-btn not bound after retries');
    }
  }
  function start(){
    if (timer) return;
    timer = setInterval(tryBind, 100);
    tryBind();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();