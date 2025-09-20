;(function(){
  function createToolbar(){
    const el = document.createElement('div');
    el.id = 'html-toolbar';
    el.style.position = 'fixed';
    el.style.top = '80px';
    el.style.left = '20px';
    el.style.zIndex = '2000';
    el.style.background = 'rgba(30,30,30,0.85)';
    el.style.border = '1px solid rgba(255,255,255,0.12)';
    el.style.borderRadius = '6px';
    el.style.padding = '6px';
    el.style.minWidth = '180px';
    el.style.minHeight = '36px';
    el.style.backdropFilter = 'blur(4px)';
    el.style.display = 'flex';
    el.style.gap = '6px';
    el.style.flexWrap = 'wrap';
    el.style.userSelect = 'none';
    el.style.cursor = 'move';

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.gap = '6px';
    content.style.flexWrap = 'wrap';
    content.style.cursor = 'default';
    content.style.alignItems = 'center';
    content.style.minHeight = '24px';

    // placeholder while loading
    const placeholder = document.createElement('span');
    placeholder.textContent = '加载中…';
    placeholder.style.color = '#ddd';
    placeholder.style.fontSize = '12px';
    content.appendChild(placeholder);

    el.appendChild(content);
    document.body.appendChild(el);
    
    // 将工具栏定位到画布容器的顶部中间
    positionElementOverCanvas(el, { defaultWidth: 200, topOffset: 10 });

    // drag
    let dragging=false, sx=0, sy=0, sl=0, st=0;
    function down(e){
      dragging = true; const p = e.touches? e.touches[0]:e;
      sx = p.clientX; sy = p.clientY; const r = el.getBoundingClientRect(); sl = r.left; st = r.top; e.preventDefault();
    }
    function move(e){ if(!dragging) return; const p = e.touches? e.touches[0]:e; const dx=p.clientX-sx, dy=p.clientY-sy; el.style.left=(sl+dx)+'px'; el.style.top=(st+dy)+'px'; }
    function up(){ dragging=false; }
    el.addEventListener('mousedown', down); document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    el.addEventListener('touchstart', down, {passive:false}); document.addEventListener('touchmove', move, {passive:false}); document.addEventListener('touchend', up);

    return {root: el, content};
  }

  async function getItems(){
    if (!window.Module) return [];
    try{
      const ptr = Module.ccall('emsGetToolbarQuickAccess','string',[],[]);
      const json = typeof ptr === 'string' ? ptr : UTF8ToString(ptr);
      const items = JSON.parse(json||'[]');
      // filter to common actions if present
      const wanted = ['fit data','select objects','move object'];
      const normalized = (s)=> (s||'').toString().trim().toLowerCase();
      const isWanted = (slot)=>{
        const name = normalized(slot.name);
        const caption = normalized(slot.caption);
        return wanted.includes(name) || wanted.includes(caption);
      };
      let filtered = items.filter(isWanted);
      if (!filtered.length) {
        // fallback to names-only list
        try{
          const p2 = Module.ccall('emsGetToolbarItems','string',[],[]);
          const j2 = typeof p2 === 'string' ? p2 : UTF8ToString(p2);
          const list = JSON.parse(j2||'[]');
          filtered = list
            .map(n=>({name:n, caption:n}))
            .filter(isWanted);
          if (!filtered.length) return list.map(n=>({name:n, caption:n}));
        }catch(_e){ /* ignore */ }
      }
      return filtered;
    }catch(e){ console.error('emsGetToolbarItems failed', e); return []; }
  }

  function makeButton(slot){
    const b = document.createElement('button');
    const title = translateTitle(slot.caption || slot.name, slot.name);
    b.textContent = title;
    b.title = slot.tooltip || title;
    b.style.fontSize='12px';
    b.style.padding='6px 8px';
    b.style.background='#3b82f6';
    b.style.color='#fff';
    b.style.border='none';
    b.style.borderRadius='4px';
    b.style.cursor='pointer';
    b.dataset.itemName = slot.name;
    b.addEventListener('click',()=>{
      console.log('[toolbar] click', { schemaName: slot.name, title } );
      try{
        const ok = Module.ccall('emsInvokeToolbarItem','number',['string'],[slot.name]);
        console.log('[toolbar] emsInvokeToolbarItem', slot.name, '->', ok);
      }catch(e){ console.error('invoke failed', slot.name, e); }
      // refresh highlights right after action
      setTimeout(updateActiveHighlights, 50);
    });
    return b;
  }

  function normName(s){ return (s||'').toString().trim().toLowerCase(); }

  function updateActiveHighlights(){
    try{
      const ptr = Module.ccall('emsGetActiveItems','string',[],[]);
      const json = typeof ptr === 'string' ? ptr : UTF8ToString(ptr);
      const activesArr = JSON.parse(json||'[]').map(s=> (s||'').toString());
      console.log('[toolbar] active items (raw)', activesArr);
      const actives = new Set(activesArr.map(normName));
      const hasAnyActive = actives.size > 0;
      const root = document.getElementById('html-toolbar');
      if (!root) return;
      root.querySelectorAll('button').forEach(btn=>{
        const name = btn.dataset.itemName || btn.textContent;
        const nameNorm = normName(name);
        if (!btn.dataset._logged){
          console.log('[toolbar] button present', {name, nameNorm, text: btn.textContent});
          btn.dataset._logged = '1';
        }
        const isActiveListBtn = (nameNorm === normName('Active Plugins List')) || btn.textContent.includes('活动');
        const shouldHighlight = isActiveListBtn ? hasAnyActive : actives.has(nameNorm);
        if (shouldHighlight){
          btn.style.outline = '2px solid #f59e0b';
          btn.style.background = '#2563eb';
          if (isActiveListBtn){
            btn.disabled = false;
            btn.style.pointerEvents = 'none'; // keep unclickable but not greyed
            btn.style.opacity = '1';
          }
        } else {
          if (isActiveListBtn){
            btn.style.background = '#6b7280';
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
          } else {
            btn.style.background = '#3b82f6';
          }
          btn.style.outline = 'none';
        }
      });

      // sync Move Object panel visibility with active state
      syncMovePanel(activesArr);
    }catch(e){ /* ignore */ }
  }

  function translateTitle(caption, fallbackName){
    const norm = (s)=> (s||'').toString().trim().toLowerCase();
    const key = norm(caption) || norm(fallbackName);
    const map = {
      'fit data':'适应',
      'fit scene':'适应场景',
      'select objects':'选择对象',
      'move object':'移动对象',
      'rotate object':'旋转对象',
      'scale object':'缩放对象',
      'active plugins list':'活动列表',
      'open files':'打开文件',
      'save selected':'保存选中',
      'delete':'删除',
      'center object':'居中',
      'center':'居中',
      'fit':'适应',
    };
    return map[key] || caption || fallbackName || '';
  }

  function positionElementOverCanvas(element, options = {}) {
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) return;
    
    const rect = canvasContainer.getBoundingClientRect();
    const elementWidth = element.offsetWidth || options.defaultWidth || 200;
    const topOffset = options.topOffset || 10;
    
    // 计算画布容器的中心位置
    const canvasCenterX = rect.left + rect.width / 2;
    const canvasTop = rect.top;
    
    // 设置元素位置：画布顶部中间
    element.style.left = (canvasCenterX - elementWidth / 2) + 'px';
    element.style.top = (canvasTop + topOffset) + 'px';
  }

  function ensureUI(){
    let el = document.getElementById('html-toolbar');
    if (!el){
      console.log('[toolbar] creating container');
      return createToolbar();
    }
    const content = el.firstChild;
    return {root: el, content};
  }

  // ===== Move Object floating panel =====
  function createMovePanel(){
    const panel = document.createElement('div');
    panel.id = 'move-object-panel';
    panel.style.position = 'fixed';
    panel.style.top = '140px';
    panel.style.left = '20px';
    panel.style.zIndex = '2001';
    panel.style.background = 'rgba(30,30,30,0.92)';
    panel.style.border = '1px solid rgba(255,255,255,0.12)';
    panel.style.borderRadius = '6px';
    panel.style.minWidth = '240px';
    panel.style.color = '#ddd';

    const header = document.createElement('div');
    header.textContent = '移动对象';
    header.style.padding = '8px 10px';
    header.style.cursor = 'move';
    header.style.background = 'rgba(255,255,255,0.04)';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = '关闭并取消选择“移动对象”';
    closeBtn.style.background = 'transparent';
    closeBtn.style.color = '#ddd';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', ()=>{
      try{ Module.ccall('emsInvokeToolbarItem','number',['string'],['Move object']); }catch(e){}
      panel.style.display = 'none';
      setTimeout(updateActiveHighlights, 50);
    });

    const body = document.createElement('div');
    body.style.padding = '10px';
    body.style.fontSize = '12px';

    // state (local UI only for now)
    let mode = 'move'; // move | rotate | scale
    let target = 'picked'; // picked | selected

    function renderInstruction(){
      let text = '';
      if (mode === 'scale') text = '用鼠标左键拖拽进行等比缩放，右键为非等比缩放。';
      else if (mode === 'rotate') text = '用鼠标左键拖拽进行旋转。';
      else text = '用鼠标左键拖拽进行移动。';
      return `<div style="opacity:.9">${text}</div>`;
    }

    function radio(name, value, current, label){
      const checked = value===current ? 'checked' : '';
      return `<label style="margin-right:10px;cursor:pointer"><input type="radio" name="${name}" value="${value}" ${checked}/> ${label}</label>`;
    }

    function render(){
      body.innerHTML = '';
      const instr = document.createElement('div');
      instr.innerHTML = renderInstruction();
      body.appendChild(instr);

      const sep = document.createElement('hr'); sep.style.borderColor = 'rgba(255,255,255,0.12)';
      body.appendChild(sep);

      const modeTitle = document.createElement('div'); modeTitle.textContent = '模式:'; modeTitle.style.margin = '6px 0 4px'; body.appendChild(modeTitle);
      const modeBox = document.createElement('div');
      modeBox.innerHTML = [
        radio('xf-mode','move',mode,'移动'),
        radio('xf-mode','rotate',mode,'旋转'),
        radio('xf-mode','scale',mode,'缩放')
      ].join('');
      body.appendChild(modeBox);

      const targetTitle = document.createElement('div'); targetTitle.textContent = '目标:'; targetTitle.style.margin = '8px 0 4px'; body.appendChild(targetTitle);
      const targetBox = document.createElement('div');
      targetBox.innerHTML = [
        radio('xf-target','picked',target,'拾取的对象'),
        radio('xf-target','selected',target,'选中的对象(们)')
      ].join('');
      body.appendChild(targetBox);

      // listeners
      modeBox.querySelectorAll('input[name="xf-mode"]').forEach(inp=>{
        inp.addEventListener('change',()=>{ 
          mode = inp.value; 
          try{ Module.ccall('emsSetMoveMode','void',['number'],[ mode==='move'?0: mode==='rotate'?1:2 ]); }catch(e){}
          render(); 
        });
      });
      targetBox.querySelectorAll('input[name="xf-target"]').forEach(inp=>{
        inp.addEventListener('change',()=>{ 
          target = inp.value; 
          try{ Module.ccall('emsSetMoveTarget','void',['number'],[ target==='picked'?0:1 ]); }catch(e){}
        });
      });

      const hint = document.createElement('div');
      hint.style.opacity = '.7';
      hint.style.marginTop = '8px';
      hint.innerHTML = '提示：按 Ctrl 旋转，按 Alt 缩放，按 Shift 移动选中对象；具体以快捷键为准。';
      body.appendChild(hint);
    }

    render();

    header.appendChild(closeBtn);
    panel.appendChild(header);
    panel.appendChild(body);
    document.body.appendChild(panel);
    
    // 将移动对象面板定位到画布容器的顶部中间
    positionElementOverCanvas(panel, { defaultWidth: 240, topOffset: 60 });

    // drag
    let dragging=false,sx=0,sy=0,sl=0,st=0;
    function down(e){ dragging=true; const p=e.touches?e.touches[0]:e; sx=p.clientX; sy=p.clientY; const r=panel.getBoundingClientRect(); sl=r.left; st=r.top; e.preventDefault(); }
    function move(e){ if(!dragging) return; const p=e.touches?e.touches[0]:e; const dx=p.clientX-sx, dy=p.clientY-sy; panel.style.left=(sl+dx)+'px'; panel.style.top=(st+dy)+'px'; }
    function up(){ dragging=false; }
    header.addEventListener('mousedown',down); document.addEventListener('mousemove',move); document.addEventListener('mouseup',up);
    header.addEventListener('touchstart',down,{passive:false}); document.addEventListener('touchmove',move,{passive:false}); document.addEventListener('touchend',up);

    return panel;
  }

  function ensureMovePanel(){
    let p = document.getElementById('move-object-panel');
    if (!p) p = createMovePanel();
    return p;
  }

  function syncMovePanel(activeNames){
    const hasMove = activeNames.some(n => (n||'').toLowerCase() === 'move object');
    const panel = ensureMovePanel();
    panel.style.display = hasMove ? 'block' : 'none';
    
    // 如果面板显示，重新定位到画布顶部中间
    if (hasMove) {
      positionElementOverCanvas(panel, { defaultWidth: 240, topOffset: 60 });
    }
  }

  function populate(){
    const ui = ensureUI();
    if (!ui){ console.error('[toolbar] failed to ensure UI'); return; }
    getItems().then(items=>{
      console.log('[toolbar] quick access items', items);
      ui.content.textContent = '';
      if (!items || !items.length){
        const tip = document.createElement('span');
        tip.textContent = '暂无工具';
        tip.style.color = '#ddd';
        tip.style.fontSize = '12px';
        ui.content.appendChild(tip);
        return;
      }
      // Always add Active List button first
      const activeBtn = document.createElement('button');
      activeBtn.textContent = translateTitle('Active Plugins List','Active Plugins List');
      activeBtn.title = '当前激活工具指示';
      activeBtn.style.fontSize='12px';
      activeBtn.style.padding='6px 8px';
      activeBtn.style.background='#6b7280';
      activeBtn.style.color='#fff';
      activeBtn.style.border='none';
      activeBtn.style.borderRadius='4px';
      activeBtn.style.cursor='default';
      activeBtn.disabled = true;
      activeBtn.dataset.itemName = 'Active Plugins List';
      ui.content.appendChild(activeBtn);

      items.forEach(slot=> ui.content.appendChild(makeButton(slot)) );
      updateActiveHighlights();
      
      // 重新定位工具栏到画布顶部中间
      positionElementOverCanvas(ui.root, { defaultWidth: 200, topOffset: 10 });
    });
  }

  // Create UI as soon as DOM is ready (shows placeholder), then populate when WASM is ready
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureUI);
  } else {
    ensureUI();
  }
  window.Module = window.Module || {};
  Module.postRun = Module.postRun || [];
  Module.postRun.push(populate);
  // Fallback populate in case postRun never fires (e.g. caching or load order issues)
  window.addEventListener('load', ()=> setTimeout(populate, 1500));
  
  // Test function to manually check active items (for debugging)
  window.testActiveItems = function(){
    try{
      const ptr = Module.ccall('emsGetActiveItems','string',[],[]);
      const json = typeof ptr === 'string' ? ptr : UTF8ToString(ptr);
      const actives = JSON.parse(json||'[]');
      console.log('[toolbar] test active items:', actives);
      updateActiveHighlights();
      return actives;
    }catch(e){
      console.error('[toolbar] test failed:', e);
      return [];
    }
  };
  
  // No polling; refresh on user actions only
})();


