document.addEventListener('DOMContentLoaded', () => {
  // Chủ đề giao diện theo tâm trạng
  const validThemes = ['default','chatgpt','github','shopee','youtube','tiktok'];

  const readSavedTheme = () => {
    try {
      const saved = localStorage.getItem('scientist-theme');
      return validThemes.includes(saved) ? saved : 'default';
    } catch (err) {
      return 'default';
    }
  };

  const saveTheme = theme => {
    try {
      localStorage.setItem('scientist-theme', theme);
    } catch (err) {
      // Trình duyệt có thể chặn lưu cục bộ; giao diện vẫn đổi bình thường.
    }
  };

  const applyTheme = theme => {
    const selectedTheme = validThemes.includes(theme) ? theme : 'default';
    document.body.setAttribute('data-theme', selectedTheme);
    saveTheme(selectedTheme);

    document.querySelectorAll('.theme-option').forEach(option => {
      const isActive = option.dataset.themeOption === selectedTheme;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  applyTheme(readSavedTheme());

  document.addEventListener('click', event => {
    const option = event.target.closest('.theme-option');
    if (!option) return;

    event.preventDefault();
    event.stopPropagation();
    applyTheme(option.dataset.themeOption);

    const menuButton = document.getElementById('themeMenuButton');
    if (menuButton && window.bootstrap?.Dropdown) {
      bootstrap.Dropdown.getOrCreateInstance(menuButton).hide();
    }
  });

  const editBtn = document.getElementById('editGeneralBtn');
  const saveBtn = document.getElementById('saveGeneralBtn');
  const fields = document.querySelectorAll('.general-field');

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      fields.forEach(el => el.disabled = false);
      editBtn.style.display = 'none';
      saveBtn.style.display = 'inline-block';
    });
  }

  const workCurrent = document.getElementById('workCurrent');
  const workEndDate = document.getElementById('workEndDate');
  if (workCurrent && workEndDate) {
    workCurrent.addEventListener('change', () => {
      workEndDate.disabled = workCurrent.checked;
      if (workCurrent.checked) workEndDate.value = '';
    });
  }

  // Học vị / Học hàm
  const credentialKind = document.getElementById('credentialKind');
  const degreeFields = document.getElementById('degreeFields');
  const titleFields = document.getElementById('titleFields');
  document.querySelectorAll('.credential-open').forEach(el => {
    el.addEventListener('click', () => {
      const kind = el.dataset.kind;
      if (credentialKind) credentialKind.value = kind;
      document.querySelector('#addCredential .modal-title').textContent =
        kind === 'title' ? 'Thêm học hàm' : 'Thêm học vị';
      if (degreeFields) degreeFields.classList.toggle('d-none', kind === 'title');
      if (titleFields) titleFields.classList.toggle('d-none', kind !== 'title');
    });
  });

  const studyLevel = document.getElementById('studyLevel');
  const degreeLevel = document.getElementById('degreeLevel');
  const degreeOptions = {
    undergraduate: [
      ['Cử nhân','Cử nhân'],
      ['Kỹ sư','Kỹ sư']
    ],
    postgraduate: [
      ['Thạc sĩ','Thạc sĩ'],
      ['Tiến sĩ (PhD)','Tiến sĩ (PhD)'],
      ['Tiến sĩ (DBA)','Tiến sĩ (DBA)']
    ]
  };
  if (studyLevel && degreeLevel) {
    studyLevel.addEventListener('change', () => {
      degreeLevel.innerHTML = '<option value="">Chọn học vị</option>';
      const options = degreeOptions[studyLevel.value] || [];
      options.forEach(([value,label]) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        degreeLevel.appendChild(opt);
      });
      degreeLevel.disabled = options.length === 0;
    });
  }

  // Chứng chỉ ngoại ngữ
  const cert = document.getElementById('languageCertificate');
  const certOther = document.getElementById('certificateOther');
  if (cert && certOther) {
    cert.addEventListener('change', () => {
      certOther.classList.toggle('d-none', cert.value !== 'Khác');
      if (cert.value !== 'Khác') certOther.value = '';
    });
  }

  // Giải thưởng
  const awardCategory = document.getElementById('awardCategory');
  if (awardCategory) {
    awardCategory.addEventListener('change', () => {
      const transfer = awardCategory.value === 'tech_transfer';
      document.getElementById('awardName').placeholder = transfer ? 'Tên công nghệ/giải pháp' : 'Tên giải thưởng';
      document.getElementById('awardOrg').placeholder = transfer ? 'Nơi áp dụng' : 'Nơi cấp';
      document.getElementById('awardYear').placeholder = transfer ? 'Năm chuyển giao' : 'Năm cấp';
    });
  }

  // Demo lưu cục bộ trên GitHub Pages để có thể thử giao diện.
  const toast = (message, kind='success') => {
    const host = document.getElementById('toastHost');
    if (!host) return;
    const cls = kind === 'danger' ? 'danger' : kind === 'warning' ? 'warning' : kind === 'info' ? 'info' : 'success';
    host.innerHTML = '<div class="alert alert-' + cls + ' shadow">' + message + '</div>';
    setTimeout(() => host.innerHTML = '', 3200);
  };

  const closeModal = form => {
    const modalEl = form.closest('.modal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  };

  const removeEmpty = body => body?.querySelector('.empty-row')?.remove();

  const currentYear = new Date().getFullYear();
  const degreeYear = document.getElementById('degreeYear');
  const degreeNotGraduated = document.getElementById('degreeNotGraduated');
  const degreeThesisLabel = document.getElementById('degreeThesisLabel');
  const credentialEditKey = document.getElementById('credentialEditKey');
  const credentialSelectAll = document.getElementById('credentialSelectAll');
  const credentialSelectAllBtn = document.getElementById('credentialSelectAllBtn');
  const credentialClearSelectionBtn = document.getElementById('credentialClearSelectionBtn');
  const credentialDeleteSelectedBtn = document.getElementById('credentialDeleteSelectedBtn');

  if (degreeYear) degreeYear.max = String(currentYear);

  const updateDegreeThesisLabel = () => {
    if (!degreeThesisLabel || !degreeLevel) return;
    const value = degreeLevel.value;
    let label = 'Khóa luận/Luận văn/Luận án';
    if (value === 'Cử nhân' || value === 'Kỹ sư') label = 'Khóa luận';
    if (value === 'Thạc sĩ') label = 'Luận văn';
    if (value.includes('Tiến sĩ')) label = 'Luận án';
    degreeThesisLabel.textContent = label;
  };
  degreeLevel?.addEventListener('change', updateDegreeThesisLabel);

  if (degreeNotGraduated && degreeYear) {
    degreeNotGraduated.addEventListener('change', () => {
      degreeYear.disabled = degreeNotGraduated.checked;
      degreeYear.required = !degreeNotGraduated.checked;
      if (degreeNotGraduated.checked) degreeYear.value = '';
    });
  }

  const sortRowsByNumericColumn = (body, columnIndex) => {
    if (!body) return;
    const rows = [...body.querySelectorAll('tr:not(.empty-row)')];
    rows.sort((a,b) => Number(b.dataset.sortYear || 0) - Number(a.dataset.sortYear || 0));
    rows.forEach(row => body.appendChild(row));
  };

  const ensureCredentialEmptyState = () => {
    const body = document.getElementById('credentialBody');
    if (!body) return;
    const rows = body.querySelectorAll('tr:not(.empty-row)');
    if (!rows.length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="5" class="text-center text-muted">Chưa có dữ liệu</td></tr>';
    }
  };

  const updateCredentialSelectionUi = () => {
    const boxes = [...document.querySelectorAll('.credential-row-check')];
    const checked = boxes.filter(box => box.checked);
    if (credentialDeleteSelectedBtn) credentialDeleteSelectedBtn.disabled = checked.length === 0;
    if (credentialSelectAll) {
      credentialSelectAll.checked = boxes.length > 0 && checked.length === boxes.length;
      credentialSelectAll.indeterminate = checked.length > 0 && checked.length < boxes.length;
    }
  };

  const getCredentialRows = () => [...document.querySelectorAll('#credentialBody tr:not(.empty-row)')];

  const wireCredentialRow = row => {
    row.querySelector('.credential-row-check')?.addEventListener('change', updateCredentialSelectionUi);

    row.querySelector('.credential-delete-btn')?.addEventListener('click', () => {
      if (!confirm('Xóa thông tin đào tạo này?')) return;
      row.remove();
      ensureCredentialEmptyState();
      updateCredentialSelectionUi();
      toast('Đã xóa thông tin đào tạo.', 'info');
    });

    row.querySelector('.credential-edit-btn')?.addEventListener('click', () => {
      const kind = row.dataset.kind || 'degree';
      const modal = document.getElementById('addCredential');
      if (!modal) return;

      credentialEditKey.value = row.dataset.key || '';
      if (credentialKind) credentialKind.value = kind;
      document.querySelector('#addCredential .modal-title').textContent = kind === 'title' ? 'Chỉnh sửa học hàm' : 'Chỉnh sửa học vị';
      degreeFields?.classList.toggle('d-none', kind === 'title');
      titleFields?.classList.toggle('d-none', kind !== 'title');

      if (kind === 'title') {
        document.getElementById('titleLevel').value = row.dataset.level || '';
        document.querySelector('[name="title_major"]').value = row.dataset.major || '';
        document.querySelector('[name="title_year"]').value = row.dataset.year || '';
      } else {
        const studyLevelValue = row.dataset.studyLevel || '';
        if (studyLevel) {
          studyLevel.value = studyLevelValue;
          studyLevel.dispatchEvent(new Event('change'));
        }
        if (degreeLevel) degreeLevel.value = row.dataset.level || '';
        document.querySelector('[name="degree_major"]').value = row.dataset.major || '';
        document.querySelector('[name="degree_institution"]').value = row.dataset.institution || '';
        document.querySelector('[name="degree_thesis"]').value = row.dataset.thesis || '';
        const unfinished = row.dataset.unfinished === '1';
        if (degreeNotGraduated) degreeNotGraduated.checked = unfinished;
        if (degreeYear) {
          degreeYear.disabled = unfinished;
          degreeYear.value = unfinished ? '' : (row.dataset.year || '');
        }
        updateDegreeThesisLabel();
      }

      bootstrap.Modal.getOrCreateInstance(modal).show();
    });
  };

  const createCredentialRow = data => {
    const tr = document.createElement('tr');
    tr.dataset.key = data.key;
    tr.dataset.kind = data.kind;
    tr.dataset.level = data.level;
    tr.dataset.major = data.major;
    tr.dataset.year = data.rawYear || '';
    tr.dataset.sortYear = String(data.sortYear || 0);
    tr.dataset.studyLevel = data.studyLevel || '';
    tr.dataset.institution = data.institution || '';
    tr.dataset.thesis = data.thesis || '';
    tr.dataset.unfinished = data.unfinished ? '1' : '0';

    tr.innerHTML =
      '<td class="text-center align-middle"><input type="checkbox" class="form-check-input credential-row-check" aria-label="Chọn dòng"></td>'+
      '<td>'+escapeHtml(data.level)+'</td>'+
      '<td>'+escapeHtml(data.major)+'</td>'+
      '<td>'+escapeHtml(data.displayYear)+'</td>'+
      '<td><div class="credential-detail-text">'+escapeHtml(data.detail)+'</div>'+
      '<div class="credential-row-actions mt-2 d-flex flex-wrap gap-1">'+
      '<button type="button" class="btn btn-sm btn-outline-primary credential-edit-btn"><i class="bi bi-pencil me-1"></i>Sửa</button>'+
      '<button type="button" class="btn btn-sm btn-outline-danger credential-delete-btn"><i class="bi bi-trash me-1"></i>Xóa</button>'+
      '</div></td>';

    wireCredentialRow(tr);
    return tr;
  };

  const credentialForm = document.getElementById('credentialForm');
  if (credentialForm) credentialForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(credentialForm);
    const kind = fd.get('kind');
    const body = document.getElementById('credentialBody');
    removeEmpty(body);

    let level='', major='', displayYear='', rawYear='', detail='', sortYear=0;
    let studyLevelValue='', institution='', thesis='', unfinished=false;

    if (kind === 'title') {
      level = fd.get('title_level') || '';
      major = fd.get('title_major') || '';
      rawYear = fd.get('title_year') || '';
      if (rawYear && Number(rawYear) > currentYear) {
        toast('Năm phong không được vượt quá năm hiện tại.', 'warning');
        return;
      }
      displayYear = rawYear;
      sortYear = Number(rawYear || 0);
      detail = 'Học hàm';
    } else {
      level = fd.get('degree_level') || '';
      major = fd.get('degree_major') || '';
      studyLevelValue = fd.get('study_level') || '';
      institution = fd.get('degree_institution') || '';
      thesis = fd.get('degree_thesis') || '';
      unfinished = fd.get('degree_not_graduated') === 'on';
      rawYear = fd.get('degree_year') || '';

      if (!unfinished && rawYear && Number(rawYear) > currentYear) {
        toast('Năm tốt nghiệp không được vượt quá năm hiện tại. Nếu chưa tốt nghiệp, hãy chọn “Chưa tốt nghiệp”.', 'warning');
        return;
      }

      displayYear = unfinished ? 'Chưa tốt nghiệp' : rawYear;
      sortYear = unfinished ? currentYear + 1 : Number(rawYear || 0);
      detail = [thesis, institution].filter(Boolean).join(' — ');
    }

    const editKey = fd.get('credential_edit_key') || '';
    const data = {
      key: editKey || ('credential-' + Date.now() + '-' + Math.random().toString(36).slice(2,7)),
      kind, level, major, rawYear, displayYear, detail, sortYear,
      studyLevel:studyLevelValue, institution, thesis, unfinished
    };

    const newRow = createCredentialRow(data);
    if (editKey) {
      const oldRow = getCredentialRows().find(row => row.dataset.key === editKey);
      if (oldRow) oldRow.replaceWith(newRow); else body.appendChild(newRow);
    } else {
      body.appendChild(newRow);
    }

    sortRowsByNumericColumn(body, 3);
    updateCredentialSelectionUi();

    credentialForm.reset();
    if (credentialEditKey) credentialEditKey.value='';
    if (degreeLevel) {
      degreeLevel.innerHTML='<option value="">Chọn học vị</option>';
      degreeLevel.disabled=true;
    }
    if (degreeYear) degreeYear.disabled=false;
    updateDegreeThesisLabel();
    closeModal(credentialForm);
    toast(editKey ? 'Đã cập nhật thông tin đào tạo.' : 'Đã thêm thông tin đào tạo.');
  });

  credentialSelectAll?.addEventListener('change', () => {
    document.querySelectorAll('.credential-row-check').forEach(box => box.checked = credentialSelectAll.checked);
    updateCredentialSelectionUi();
  });

  credentialSelectAllBtn?.addEventListener('click', () => {
    document.querySelectorAll('.credential-row-check').forEach(box => box.checked = true);
    updateCredentialSelectionUi();
  });

  credentialClearSelectionBtn?.addEventListener('click', () => {
    document.querySelectorAll('.credential-row-check').forEach(box => box.checked = false);
    updateCredentialSelectionUi();
  });

  credentialDeleteSelectedBtn?.addEventListener('click', () => {
    const selected = [...document.querySelectorAll('.credential-row-check:checked')];
    if (!selected.length) return;
    if (!confirm('Xóa ' + selected.length + ' mục đào tạo đã chọn?')) return;
    selected.forEach(box => box.closest('tr')?.remove());
    ensureCredentialEmptyState();
    updateCredentialSelectionUi();
    toast('Đã xóa các mục đào tạo đã chọn.', 'info');
  });

  const managedConfigs = new Map();

  const managedRows = bodyId => [...document.querySelectorAll('#'+bodyId+' tr:not(.empty-row)')];

  const managedEnsureEmpty = (bodyId, colspan) => {
    const body = document.getElementById(bodyId);
    if (!body) return;
    if (!managedRows(bodyId).length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="'+colspan+'" class="text-center text-muted">Chưa có dữ liệu</td></tr>';
    }
  };

  const managedUpdateSelection = prefix => {
    const cfg = managedConfigs.get(prefix);
    if (!cfg) return;
    const boxes = [...document.querySelectorAll('#'+cfg.bodyId+' .managed-row-check')];
    const checked = boxes.filter(b => b.checked);
    const master = document.getElementById(prefix+'SelectAll');
    const del = document.getElementById(prefix+'DeleteSelectedBtn');
    if (master) {
      master.checked = boxes.length > 0 && checked.length === boxes.length;
      master.indeterminate = checked.length > 0 && checked.length < boxes.length;
    }
    if (del) del.disabled = checked.length === 0;
  };

  const managedRenumber = (bodyId, numberCellIndex) => {
    if (numberCellIndex == null) return;
    managedRows(bodyId).forEach((row,index) => {
      if (row.children[numberCellIndex]) row.children[numberCellIndex].textContent = String(index+1);
    });
  };

  const setupManagedTable = (prefix, bodyId, colspan, numberCellIndex=null) => {
    const cfg = {prefix,bodyId,colspan,numberCellIndex};
    managedConfigs.set(prefix,cfg);

    document.getElementById(prefix+'SelectAll')?.addEventListener('change', e => {
      document.querySelectorAll('#'+bodyId+' .managed-row-check').forEach(box => box.checked = e.target.checked);
      managedUpdateSelection(prefix);
    });
    document.getElementById(prefix+'SelectAllBtn')?.addEventListener('click', () => {
      document.querySelectorAll('#'+bodyId+' .managed-row-check').forEach(box => box.checked = true);
      managedUpdateSelection(prefix);
    });
    document.getElementById(prefix+'ClearSelectionBtn')?.addEventListener('click', () => {
      document.querySelectorAll('#'+bodyId+' .managed-row-check').forEach(box => box.checked = false);
      managedUpdateSelection(prefix);
    });
    document.getElementById(prefix+'DeleteSelectedBtn')?.addEventListener('click', () => {
      const selected = [...document.querySelectorAll('#'+bodyId+' .managed-row-check:checked')];
      if (!selected.length) return;
      if (!confirm('Xóa '+selected.length+' mục đã chọn?')) return;
      selected.forEach(box => box.closest('tr')?.remove());
      managedEnsureEmpty(bodyId,colspan);
      managedRenumber(bodyId,numberCellIndex);
      managedUpdateSelection(prefix);
      toast('Đã xóa các mục đã chọn.','info');
    });
  };

  const managedWireRow = (prefix,row,onEdit,onDelete) => {
    row.querySelector('.managed-row-check')?.addEventListener('change', () => managedUpdateSelection(prefix));
    row.querySelector('.managed-edit-btn')?.addEventListener('click', () => onEdit?.(row));
    row.querySelector('.managed-delete-btn')?.addEventListener('click', () => {
      if (!confirm('Xóa mục này?')) return;
      onDelete?.(row);
      row.remove();
      const cfg=managedConfigs.get(prefix);
      if (cfg) {
        managedEnsureEmpty(cfg.bodyId,cfg.colspan);
        managedRenumber(cfg.bodyId,cfg.numberCellIndex);
        managedUpdateSelection(prefix);
      }
      toast('Đã xóa mục.','info');
    });
  };

  const resetEditKey = formId => {
    const el=document.getElementById(formId+'EditKey');
    if(el) el.value='';
  };

  setupManagedTable('teaching','teachingBody',5,null);
  setupManagedTable('research','researchBody',5,null);
  setupManagedTable('language','languageBody',5,null);
  setupManagedTable('work','workBody',7,null);
  setupManagedTable('project','projectBody',10,1);
  setupManagedTable('article','articleBody',9,1);
  setupManagedTable('seminar','seminarBody',8,1);
  setupManagedTable('textbook','textbookBody',8,1);
  setupManagedTable('award','awardBody',8,1);

  // Thông tin bổ sung: môn giảng dạy / hướng nghiên cứu
  const additionForm = document.getElementById('additionForm');
  if (additionForm) additionForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd=new FormData(additionForm);
    const type=fd.get('type') || 'teaching';
    const prefix=type === 'research' ? 'research' : 'teaching';
    const bodyId=prefix+'Body';
    const body=document.getElementById(bodyId);
    removeEmpty(body);
    const editKey=fd.get('edit_key') || '';
    const key=editKey || (prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
    const row=document.createElement('tr');
    row.dataset.key=key;
    row.dataset.type=type;
    row.dataset.major=fd.get('major') || '';
    row.dataset.title=fd.get('title') || '';
    row.dataset.description=fd.get('description') || '';
    row.innerHTML=
      '<td class="text-center"><input class="form-check-input managed-row-check" type="checkbox"></td>'+
      '<td>'+escapeHtml(row.dataset.major)+'</td>'+
      '<td>'+escapeHtml(row.dataset.title)+'</td>'+
      '<td>'+escapeHtml(row.dataset.description)+'</td>'+
      '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-primary managed-edit-btn me-1"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-sm btn-outline-danger managed-delete-btn"><i class="bi bi-trash"></i></button></td>';
    managedWireRow(prefix,row, r => {
      additionForm.elements.edit_key.value=r.dataset.key;
      additionForm.elements.type.value=r.dataset.type;
      additionForm.elements.major.value=r.dataset.major;
      additionForm.elements.title.value=r.dataset.title;
      additionForm.elements.description.value=r.dataset.description;
      document.querySelector('#addAddition .modal-title').textContent='Chỉnh sửa thông tin bổ sung';
      bootstrap.Modal.getOrCreateInstance(document.getElementById('addAddition')).show();
    });
    if(editKey){
      const old=managedRows(bodyId).find(r=>r.dataset.key===editKey);
      old?.replaceWith(row);
    }else body.appendChild(row);
    additionForm.reset(); resetEditKey('additionForm');
    document.querySelector('#addAddition .modal-title').textContent='Thêm thông tin bổ sung';
    closeModal(additionForm); managedUpdateSelection(prefix);
    toast(editKey?'Đã cập nhật thông tin.':'Đã thêm thông tin.');
  });

  const languageForm = document.getElementById('languageForm');
  if (languageForm) languageForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd=new FormData(languageForm);
    const certificate=fd.get('certificate')==='Khác' ? (fd.get('certificate_other')||'Khác') : (fd.get('certificate')||'');
    const body=document.getElementById('languageBody'); removeEmpty(body);
    const editKey=fd.get('edit_key')||'';
    const key=editKey||('language-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
    const row=document.createElement('tr');
    row.dataset.key=key; row.dataset.name=fd.get('name')||''; row.dataset.proficiency=fd.get('proficiency')||''; row.dataset.certificate=certificate;
    row.innerHTML='<td class="text-center"><input class="form-check-input managed-row-check" type="checkbox"></td>'+
      '<td>'+escapeHtml(row.dataset.name)+'</td><td>'+escapeHtml(row.dataset.proficiency)+'</td><td>'+escapeHtml(certificate)+'</td>'+
      '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-primary managed-edit-btn me-1"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-sm btn-outline-danger managed-delete-btn"><i class="bi bi-trash"></i></button></td>';
    managedWireRow('language',row,r=>{
      languageForm.elements.edit_key.value=r.dataset.key;
      languageForm.elements.name.value=r.dataset.name;
      languageForm.elements.proficiency.value=r.dataset.proficiency;
      const known=['IELTS','TOEIC','VSTEP','SAT','TOEFL'];
      if(known.includes(r.dataset.certificate)){ languageForm.elements.certificate.value=r.dataset.certificate; certOther?.classList.add('d-none'); }
      else { languageForm.elements.certificate.value='Khác'; if(certOther){certOther.classList.remove('d-none');certOther.value=r.dataset.certificate;} }
      document.querySelector('#addLanguage .modal-title').textContent='Chỉnh sửa ngoại ngữ';
      bootstrap.Modal.getOrCreateInstance(document.getElementById('addLanguage')).show();
    });
    if(editKey){managedRows('languageBody').find(r=>r.dataset.key===editKey)?.replaceWith(row);} else body.appendChild(row);
    languageForm.reset(); resetEditKey('languageForm'); certOther?.classList.add('d-none');
    document.querySelector('#addLanguage .modal-title').textContent='Thêm ngoại ngữ';
    closeModal(languageForm); managedUpdateSelection('language'); toast(editKey?'Đã cập nhật ngoại ngữ.':'Đã thêm ngoại ngữ.');
  });

  const workForm = document.getElementById('workForm');
  if (workForm) workForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd=new FormData(workForm), body=document.getElementById('workBody'); removeEmpty(body);
    const editKey=fd.get('edit_key')||'', key=editKey||('work-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
    const row=document.createElement('tr');
    row.dataset.key=key; row.dataset.start=fd.get('start')||''; row.dataset.end=fd.get('end')||''; row.dataset.current=fd.get('current')==='on'?'1':'0';
    row.dataset.institution=fd.get('institution')||''; row.dataset.position=fd.get('position')||''; row.dataset.description=fd.get('description')||''; row.dataset.sortYear=(row.dataset.start||'').replaceAll('-','')||'0';
    row.innerHTML='<td class="text-center"><input class="form-check-input managed-row-check" type="checkbox"></td>'+
      '<td>'+escapeHtml(row.dataset.start)+'</td><td>'+escapeHtml(row.dataset.current==='1'?'Hiện tại':row.dataset.end)+'</td><td>'+escapeHtml(row.dataset.institution)+'</td><td>'+escapeHtml(row.dataset.position)+'</td><td>'+escapeHtml(row.dataset.description)+'</td>'+
      '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-primary managed-edit-btn me-1"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-sm btn-outline-danger managed-delete-btn"><i class="bi bi-trash"></i></button></td>';
    managedWireRow('work',row,r=>{
      workForm.elements.edit_key.value=r.dataset.key; workForm.elements.start.value=r.dataset.start; workForm.elements.end.value=r.dataset.end;
      workForm.elements.current.checked=r.dataset.current==='1'; workEndDate.disabled=r.dataset.current==='1';
      workForm.elements.institution.value=r.dataset.institution; workForm.elements.position.value=r.dataset.position; workForm.elements.description.value=r.dataset.description;
      document.querySelector('#addWork .modal-title').textContent='Chỉnh sửa quá trình công tác';
      bootstrap.Modal.getOrCreateInstance(document.getElementById('addWork')).show();
    });
    if(editKey){managedRows('workBody').find(r=>r.dataset.key===editKey)?.replaceWith(row);} else body.appendChild(row);
    sortRowsByNumericColumn(body,1);
    workForm.reset(); resetEditKey('workForm'); workEndDate.disabled=false;
    document.querySelector('#addWork .modal-title').textContent='Thêm quá trình công tác';
    closeModal(workForm); managedUpdateSelection('work'); toast(editKey?'Đã cập nhật quá trình công tác.':'Đã thêm quá trình công tác.');
  });

  const projectForm = document.getElementById('projectForm');
  if (projectForm) projectForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd=new FormData(projectForm), body=document.getElementById('projectBody'); removeEmpty(body);
    const editKey=fd.get('edit_key')||'', key=editKey||('project-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
    const row=document.createElement('tr');
    Object.assign(row.dataset,{key,title:fd.get('title')||'',startYear:fd.get('start_year')||'',endYear:fd.get('end_year')||'',level:fd.get('level')||'',position:fd.get('position')||'',budget:fd.get('budget')||'',budgetUnit:fd.get('budget_unit')||''});
    row.dataset.sortYear=row.dataset.startYear||'0';
    row.innerHTML='<td class="text-center"><input class="form-check-input managed-row-check" type="checkbox"></td><td></td>'+
      '<td>'+escapeHtml(row.dataset.title)+'</td><td>'+escapeHtml(row.dataset.startYear)+'</td><td>'+escapeHtml(row.dataset.endYear)+'</td><td>'+escapeHtml(row.dataset.level)+'</td><td>'+escapeHtml(row.dataset.position)+'</td><td>'+escapeHtml(row.dataset.budget)+'</td><td>'+escapeHtml(row.dataset.budgetUnit)+'</td>'+
      '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-primary managed-edit-btn me-1"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-sm btn-outline-danger managed-delete-btn"><i class="bi bi-trash"></i></button></td>';
    managedWireRow('project',row,r=>{
      projectForm.elements.edit_key.value=r.dataset.key; projectForm.elements.title.value=r.dataset.title; projectForm.elements.start_year.value=r.dataset.startYear; projectForm.elements.end_year.value=r.dataset.endYear;
      projectForm.elements.level.value=r.dataset.level; projectForm.elements.position.value=r.dataset.position; projectForm.elements.budget.value=r.dataset.budget; projectForm.elements.budget_unit.value=r.dataset.budgetUnit;
      document.querySelector('#addProject .modal-title').textContent='Chỉnh sửa đề tài';
      bootstrap.Modal.getOrCreateInstance(document.getElementById('addProject')).show();
    });
    if(editKey){managedRows('projectBody').find(r=>r.dataset.key===editKey)?.replaceWith(row);} else body.appendChild(row);
    sortRowsByNumericColumn(body,3); managedRenumber('projectBody',1);
    projectForm.reset(); resetEditKey('projectForm'); document.querySelector('#addProject .modal-title').textContent='Thêm đề tài đang tham gia';
    closeModal(projectForm); managedUpdateSelection('project'); toast(editKey?'Đã cập nhật đề tài.':'Đã thêm đề tài.');
  });

  const publicationEvidenceFiles = new Map();

  const normalizeArticleKey = article => {
    const doi = String(article.doi || article.doi_or_url || '').trim().toLowerCase()
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i,'')
      .replace(/^doi:\s*/i,'');
    if (doi && /^10\.\d{4,9}\//i.test(doi)) return 'doi:' + doi;
    return 'meta:' + [article.title, article.journal || article.location, article.year]
      .map(v => String(v || '').trim().toLowerCase().replace(/\s+/g,' ')).join('|');
  };

  const getExistingArticleKeys = () => new Set(
    [...document.querySelectorAll('#articleBody tr:not(.empty-row)')]
      .map(row => row.dataset.articleKey)
      .filter(Boolean)
  );

  const renumberArticleRows = () => {
    document.querySelectorAll('#articleBody tr:not(.empty-row)').forEach((row,index) => {
      if (row.children[1]) row.children[1].textContent = String(index + 1);
    });
  };

  const addArticleActions = row => {
    row.querySelector('.article-delete-btn')?.addEventListener('click', () => {
      const key = row.dataset.articleKey;
      if (confirm('Xóa bài báo này khỏi hồ sơ?')) {
        publicationEvidenceFiles.delete(key);
        row.remove();
        renumberArticleRows();
        managedUpdateSelection('article');
        if (!document.querySelector('#articleBody tr:not(.empty-row)')) {
          document.getElementById('articleBody').innerHTML='<tr class="empty-row"><td colspan="8" class="text-center text-muted">Chưa có dữ liệu</td></tr>';
        }
        toast('Đã xóa bài báo.', 'info');
      }
    });

    row.querySelector('.article-edit-btn')?.addEventListener('click', () => {
      const form = document.getElementById('publicationForm');
      if (!form) return;
      form.elements.edit_index.value = row.dataset.articleKey || '';
      form.elements.title.value = row.dataset.title || '';
      form.elements.authors.value = row.dataset.authors || '';
      form.elements.issn.value = row.dataset.issn || '';
      form.elements.location.value = row.dataset.journal || '';
      form.elements.published_month.value = row.dataset.year ? row.dataset.year + '-01' : '';
      form.elements.doi_or_url.value = row.dataset.doi || '';
      form.elements.description.value = row.dataset.description || '';
      bootstrap.Modal.getOrCreateInstance(document.getElementById('addPublicationManual')).show();
    });
  };

  const createArticleRow = article => {
    const key = normalizeArticleKey(article);
    const file = article.file || null;
    const tr = document.createElement('tr');
    tr.dataset.articleKey = key;
    tr.dataset.title = article.title || '';
    tr.dataset.authors = article.authors || '';
    tr.dataset.year = article.year || '';
    tr.dataset.issn = article.issn || '';
    tr.dataset.journal = article.journal || article.location || '';
    tr.dataset.doi = article.doi || article.doi_or_url || '';
    tr.dataset.description = article.description || '';
    tr.dataset.sortYear = String(Number(article.year || 0));

    let evidenceHtml = '<span class="text-muted">—</span>';
    if (file) {
      publicationEvidenceFiles.set(key, file);
      const blobUrl = URL.createObjectURL(file);
      evidenceHtml = '<a href="'+blobUrl+'" target="_blank" class="btn btn-sm btn-outline-secondary">PDF</a>';
    }

    tr.innerHTML =
      '<td class="text-center"><input class="form-check-input managed-row-check" type="checkbox"></td><td></td>'+
      '<td>'+escapeHtml(article.title || '')+'</td>'+
      '<td>'+escapeHtml(article.authors || '')+'</td>'+
      '<td>'+escapeHtml(article.year || '')+'</td>'+
      '<td>'+escapeHtml(article.issn || '')+'</td>'+
      '<td>'+escapeHtml(article.journal || article.location || '')+'</td>'+
      '<td>'+evidenceHtml+'</td>'+
      '<td><div class="d-flex gap-1 justify-content-center">'+
      '<button type="button" class="btn btn-sm btn-outline-primary article-edit-btn" title="Chỉnh sửa"><i class="bi bi-pencil"></i></button>'+
      '<button type="button" class="btn btn-sm btn-outline-danger article-delete-btn" title="Xóa"><i class="bi bi-trash"></i></button>'+
      '</div></td>';
    addArticleActions(tr);
    tr.querySelector('.managed-row-check')?.addEventListener('change',()=>managedUpdateSelection('article'));
    return tr;
  };

  const upsertArticle = article => {
    const body = document.getElementById('articleBody');
    if (!body) return false;
    removeEmpty(body);
    const key = normalizeArticleKey(article);
    const editingKey = article.editingKey || '';
    const existing = [...body.querySelectorAll('tr:not(.empty-row)')].find(row => row.dataset.articleKey === key && row.dataset.articleKey !== editingKey);

    if (existing) {
      toast('Bài báo này đã có trong hồ sơ. Hệ thống không thêm bản trùng.', 'warning');
      return false;
    }

    if (editingKey) {
      const oldRow = [...body.querySelectorAll('tr:not(.empty-row)')].find(row => row.dataset.articleKey === editingKey);
      if (oldRow) {
        publicationEvidenceFiles.delete(editingKey);
        oldRow.replaceWith(createArticleRow(article));
      } else {
        body.appendChild(createArticleRow(article));
      }
    } else {
      body.appendChild(createArticleRow(article));
    }

    sortRowsByNumericColumn(body, 4);
    renumberArticleRows();
    managedUpdateSelection('article');
    return true;
  };

  const publicationForm = document.getElementById('publicationForm');
  if (publicationForm) publicationForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(publicationForm);
    const month = fd.get('published_month') || '';
    const year = month ? month.split('-')[0] : '';
    if (year && Number(year) > currentYear) {
      toast('Năm xuất bản không được vượt quá năm hiện tại.', 'warning');
      return;
    }
    const file = document.getElementById('publicationEvidencePdf')?.files?.[0] || null;
    if (file && file.type && file.type !== 'application/pdf') {
      toast('Minh chứng phải là file PDF.', 'warning');
      return;
    }

    const article = {
      title: fd.get('title') || '',
      authors: fd.get('authors') || '',
      year,
      issn: fd.get('issn') || '',
      journal: fd.get('location') || '',
      doi_or_url: fd.get('doi_or_url') || '',
      description: fd.get('description') || '',
      file,
      editingKey: fd.get('edit_index') || ''
    };

    if (!upsertArticle(article)) return;

    publicationForm.reset();
    document.getElementById('publicationEditIndex').value='';
    closeModal(publicationForm);
    toast(article.editingKey ? 'Đã cập nhật bài báo.' : 'Đã thêm bài báo khoa học.');
  });

  const seminarForm = document.getElementById('seminarForm');
  if (seminarForm) seminarForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd=new FormData(seminarForm), body=document.getElementById('seminarBody'); removeEmpty(body);
    const editKey=fd.get('edit_key')||'', key=editKey||('seminar-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
    const month=fd.get('month')||'', year=fd.get('year')||'', published=[month,year].filter(Boolean).join('/');
    const row=document.createElement('tr');
    Object.assign(row.dataset,{key,title:fd.get('title')||'',publisher:fd.get('publisher')||'',publicationType:fd.get('publication_type')||'',month,year,description:fd.get('description')||''});
    row.dataset.sortYear=year||'0';
    row.innerHTML='<td class="text-center"><input class="form-check-input managed-row-check" type="checkbox"></td><td></td>'+
      '<td>'+escapeHtml(row.dataset.title)+'</td><td>'+escapeHtml(published)+'</td><td>'+escapeHtml(row.dataset.publisher)+'</td><td>'+escapeHtml(row.dataset.publicationType)+'</td><td>'+escapeHtml(row.dataset.description)+'</td>'+
      '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-primary managed-edit-btn me-1"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-sm btn-outline-danger managed-delete-btn"><i class="bi bi-trash"></i></button></td>';
    managedWireRow('seminar',row,r=>{
      seminarForm.elements.edit_key.value=r.dataset.key; seminarForm.elements.publication_type.value=r.dataset.publicationType; seminarForm.elements.title.value=r.dataset.title; seminarForm.elements.publisher.value=r.dataset.publisher; seminarForm.elements.month.value=r.dataset.month; seminarForm.elements.year.value=r.dataset.year; seminarForm.elements.description.value=r.dataset.description;
      document.querySelector('#addSeminar .modal-title').textContent='Chỉnh sửa công bố khoa học';
      bootstrap.Modal.getOrCreateInstance(document.getElementById('addSeminar')).show();
    });
    if(editKey){managedRows('seminarBody').find(r=>r.dataset.key===editKey)?.replaceWith(row);} else body.appendChild(row);
    sortRowsByNumericColumn(body,3); managedRenumber('seminarBody',1);
    seminarForm.reset(); resetEditKey('seminarForm'); document.querySelector('#addSeminar .modal-title').textContent='Thêm công bố khoa học';
    closeModal(seminarForm); managedUpdateSelection('seminar'); toast(editKey?'Đã cập nhật Seminar - Hội thảo.':'Đã thêm Seminar - Hội thảo.');
  });

  const textbookForm = document.getElementById('textbookForm');
  if (textbookForm) textbookForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd=new FormData(textbookForm), body=document.getElementById('textbookBody'); removeEmpty(body);
    const editKey=fd.get('edit_key')||'', key=editKey||('textbook-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
    const month=fd.get('month')||'', year=fd.get('year')||'', published=[month,year].filter(Boolean).join('/');
    const row=document.createElement('tr');
    Object.assign(row.dataset,{key,title:fd.get('title')||'',publisher:fd.get('publisher')||'',month,year,description:fd.get('description')||''});
    row.dataset.sortYear=year||'0';
    row.innerHTML='<td class="text-center"><input class="form-check-input managed-row-check" type="checkbox"></td><td></td>'+
      '<td>'+escapeHtml(row.dataset.title)+'</td><td>'+escapeHtml(published)+'</td><td>'+escapeHtml(row.dataset.publisher)+'</td><td></td><td>'+escapeHtml(row.dataset.description)+'</td>'+
      '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-primary managed-edit-btn me-1"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-sm btn-outline-danger managed-delete-btn"><i class="bi bi-trash"></i></button></td>';
    managedWireRow('textbook',row,r=>{
      textbookForm.elements.edit_key.value=r.dataset.key; textbookForm.elements.title.value=r.dataset.title; textbookForm.elements.publisher.value=r.dataset.publisher; textbookForm.elements.month.value=r.dataset.month; textbookForm.elements.year.value=r.dataset.year; textbookForm.elements.description.value=r.dataset.description;
      document.querySelector('#addTextbook .modal-title').textContent='Chỉnh sửa sách giáo trình';
      bootstrap.Modal.getOrCreateInstance(document.getElementById('addTextbook')).show();
    });
    if(editKey){managedRows('textbookBody').find(r=>r.dataset.key===editKey)?.replaceWith(row);} else body.appendChild(row);
    sortRowsByNumericColumn(body,3); managedRenumber('textbookBody',1);
    textbookForm.reset(); resetEditKey('textbookForm'); document.querySelector('#addTextbook .modal-title').textContent='Thêm sách giáo trình';
    closeModal(textbookForm); managedUpdateSelection('textbook'); toast(editKey?'Đã cập nhật sách giáo trình.':'Đã thêm sách giáo trình.');
  });

  const awardForm = document.getElementById('awardForm');
  if (awardForm) awardForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd=new FormData(awardForm), body=document.getElementById('awardBody'); removeEmpty(body);
    const editKey=fd.get('edit_key')||'', key=editKey||('award-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
    const row=document.createElement('tr');
    Object.assign(row.dataset,{key,category:fd.get('category')||'',name:fd.get('name')||'',organization:fd.get('organization')||'',year:fd.get('year')||'',description:fd.get('description')||''});
    row.dataset.sortYear=row.dataset.year||'0';
    const categoryLabel=row.dataset.category==='tech_transfer'?'Chuyển giao công nghệ':'Giải thưởng KH&CN';
    row.innerHTML='<td class="text-center"><input class="form-check-input managed-row-check" type="checkbox"></td><td></td>'+
      '<td>'+escapeHtml(categoryLabel)+'</td><td>'+escapeHtml(row.dataset.name)+'</td><td>'+escapeHtml(row.dataset.organization)+'</td><td>'+escapeHtml(row.dataset.year)+'</td><td>'+escapeHtml(row.dataset.description)+'</td>'+
      '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-primary managed-edit-btn me-1"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-sm btn-outline-danger managed-delete-btn"><i class="bi bi-trash"></i></button></td>';
    managedWireRow('award',row,r=>{
      awardForm.elements.edit_key.value=r.dataset.key; awardForm.elements.category.value=r.dataset.category; awardForm.elements.name.value=r.dataset.name; awardForm.elements.organization.value=r.dataset.organization; awardForm.elements.year.value=r.dataset.year; awardForm.elements.description.value=r.dataset.description;
      awardCategory?.dispatchEvent(new Event('change'));
      document.querySelector('#addAward .modal-title').textContent='Chỉnh sửa giải thưởng';
      bootstrap.Modal.getOrCreateInstance(document.getElementById('addAward')).show();
    });
    if(editKey){managedRows('awardBody').find(r=>r.dataset.key===editKey)?.replaceWith(row);} else body.appendChild(row);
    sortRowsByNumericColumn(body,5); managedRenumber('awardBody',1);
    awardForm.reset(); resetEditKey('awardForm'); document.querySelector('#addAward .modal-title').textContent='Thêm giải thưởng';
    closeModal(awardForm); managedUpdateSelection('award'); toast(editKey?'Đã cập nhật giải thưởng.':'Đã thêm giải thưởng.');
  });

  const publicationSearchModalEl = document.getElementById('addPublication');
  const publicationManualModalEl = document.getElementById('addPublicationManual');
  const manualOpenBtn = document.getElementById('openManualPublication');
  const backToSearchBtn = document.getElementById('backToPublicationSearch');
  const paperSearchBtn = document.getElementById('paperSearchBtn');
  const publicationSearchInput = document.getElementById('publicationSearch');
  const publicationSearchResults = document.getElementById('publicationSearchResults');
  const publicationSearchStatus = document.getElementById('publicationSearchStatus');
  const publicationAddBtn = document.getElementById('articleSearchAddBtn');
  const publicationPrevPage = document.getElementById('publicationPrevPage');
  const publicationNextPage = document.getElementById('publicationNextPage');
  const publicationPageLabel = document.getElementById('publicationPageLabel');

  const publicationSearchState = {
    query: '',
    page: 1,
    rows: 5,
    total: 0,
    items: [],
    selectedIndex: -1,
    exactDoi: false
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  const switchPublicationModal = (fromEl, toEl) => {
    if (!fromEl || !toEl) return;
    const from = bootstrap.Modal.getOrCreateInstance(fromEl);
    fromEl.addEventListener('hidden.bs.modal', () => {
      bootstrap.Modal.getOrCreateInstance(toEl).show();
    }, { once:true });
    from.hide();
  };

  if (manualOpenBtn) {
    manualOpenBtn.addEventListener('click', () => {
      switchPublicationModal(publicationSearchModalEl, publicationManualModalEl);
    });
  }

  if (backToSearchBtn) {
    backToSearchBtn.addEventListener('click', () => {
      switchPublicationModal(publicationManualModalEl, publicationSearchModalEl);
    });
  }

  const normalizeDoi = raw => {
    const value = String(raw || '').trim();
    if (!value) return '';
    const cleaned = value
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
      .replace(/^doi:\s*/i, '')
      .trim();
    return /^10\.\d{4,9}\/.+$/i.test(cleaned) ? cleaned : '';
  };

  const getPublicationYear = item => {
    const candidates = [
      item?.['published-print'],
      item?.['published-online'],
      item?.published,
      item?.issued,
      item?.created
    ];
    for (const candidate of candidates) {
      const year = candidate?.['date-parts']?.[0]?.[0];
      if (year) return year;
    }
    return '';
  };

  const getAuthors = item => {
    const authors = Array.isArray(item?.author) ? item.author : [];
    return authors.map(author => {
      const given = author?.given || '';
      const family = author?.family || '';
      return [given, family].filter(Boolean).join(' ');
    }).filter(Boolean).join(', ');
  };

  const normalizeCrossrefItem = item => ({
    title: Array.isArray(item?.title) ? (item.title[0] || '') : (item?.title || ''),
    authors: getAuthors(item),
    year: getPublicationYear(item),
    issn: Array.isArray(item?.ISSN) ? item.ISSN.join(', ') : (item?.ISSN || ''),
    journal: Array.isArray(item?.['container-title']) ? (item['container-title'][0] || '') : (item?.['container-title'] || ''),
    doi: item?.DOI || '',
    url: item?.URL || (item?.DOI ? 'https://doi.org/' + item.DOI : ''),
    publisher: item?.publisher || '',
    type: item?.type || ''
  });

  const setPublicationStatus = (message, kind='info') => {
    if (!publicationSearchStatus) return;
    if (!message) {
      publicationSearchStatus.className = 'publication-search-status d-none';
      publicationSearchStatus.textContent = '';
      return;
    }
    publicationSearchStatus.className = 'publication-search-status ' +
      (kind === 'error' ? 'text-danger' : kind === 'success' ? 'text-success' : 'text-muted');
    publicationSearchStatus.textContent = message;
  };

  const updatePublicationPager = () => {
    if (publicationPageLabel) publicationPageLabel.textContent = 'Trang ' + publicationSearchState.page;
    if (publicationPrevPage) publicationPrevPage.disabled = publicationSearchState.page <= 1;
    if (publicationNextPage) {
      const shownThrough = publicationSearchState.page * publicationSearchState.rows;
      publicationNextPage.disabled = publicationSearchState.exactDoi ||
        publicationSearchState.items.length < publicationSearchState.rows ||
        (publicationSearchState.total > 0 && shownThrough >= publicationSearchState.total);
    }
  };

  const renderPublicationResults = () => {
    if (!publicationSearchResults) return;
    const items = publicationSearchState.items;
    publicationSearchState.selectedIndex = -1;
    if (publicationAddBtn) publicationAddBtn.disabled = true;

    if (!items.length) {
      publicationSearchResults.innerHTML =
        '<div class="publication-search-empty text-muted text-center">Không tìm thấy bài báo phù hợp.</div>';
      updatePublicationPager();
      return;
    }

    publicationSearchResults.innerHTML = items.map((item,index) => {
      const title = escapeHtml(item.title || 'Không có tiêu đề');
      const authors = escapeHtml(item.authors || 'Không có thông tin tác giả');
      const journal = escapeHtml(item.journal || 'Không rõ tạp chí');
      const year = escapeHtml(item.year || '');
      const doi = escapeHtml(item.doi || '');
      const issn = escapeHtml(item.issn || '');
      return `
        <button type="button" class="crossref-result-card" data-result-index="${index}">
          <div class="crossref-result-select"><span></span></div>
          <div class="crossref-result-content">
            <div class="crossref-result-title">${title}</div>
            <div class="crossref-result-meta">${authors}</div>
            <div class="crossref-result-meta">
              ${[journal, year].filter(Boolean).join(' · ')}
            </div>
            <div class="crossref-result-identifiers">
              ${doi ? '<span>DOI: '+doi+'</span>' : ''}
              ${issn ? '<span>ISSN: '+issn+'</span>' : ''}
            </div>
          </div>
        </button>`;
    }).join('');

    publicationSearchResults.querySelectorAll('.crossref-result-card').forEach(card => {
      card.addEventListener('click', () => {
        publicationSearchResults.querySelectorAll('.crossref-result-card').forEach(x => x.classList.remove('selected'));
        card.classList.add('selected');
        publicationSearchState.selectedIndex = Number(card.dataset.resultIndex);
        if (publicationAddBtn) publicationAddBtn.disabled = false;
      });
    });

    updatePublicationPager();
  };

  const searchCrossref = async (page=1) => {
    const query = publicationSearchInput?.value.trim() || '';
    if (!query) {
      setPublicationStatus('Nhập DOI, link website hoặc tên bài báo để tìm.', 'error');
      return;
    }

    publicationSearchState.query = query;
    publicationSearchState.page = Math.max(1, page);
    publicationSearchState.items = [];
    publicationSearchState.selectedIndex = -1;
    publicationSearchState.exactDoi = false;
    if (publicationAddBtn) publicationAddBtn.disabled = true;
    if (publicationSearchResults) {
      publicationSearchResults.innerHTML =
        '<div class="publication-loading"><div class="spinner-border spinner-border-sm" role="status"></div><span>Đang tìm dữ liệu bài báo...</span></div>';
    }
    setPublicationStatus('');

    const doi = normalizeDoi(query);

    try {
      let url;
      if (doi) {
        publicationSearchState.exactDoi = true;
        url = 'https://api.crossref.org/v1/works/' + encodeURIComponent(doi);
      } else {
        const offset = (publicationSearchState.page - 1) * publicationSearchState.rows;
        const params = new URLSearchParams({
          'query.bibliographic': query,
          rows: String(publicationSearchState.rows),
          offset: String(offset)
        });
        url = 'https://api.crossref.org/v1/works?' + params.toString();
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept':'application/json' }
      });
      if (!response.ok) {
        throw new Error('Crossref HTTP ' + response.status);
      }

      const data = await response.json();
      if (doi) {
        const item = data?.message ? normalizeCrossrefItem(data.message) : null;
        publicationSearchState.items = item ? [item] : [];
        publicationSearchState.total = item ? 1 : 0;
      } else {
        const message = data?.message || {};
        publicationSearchState.items = (message.items || []).map(normalizeCrossrefItem);
        publicationSearchState.total = Number(message['total-results'] || 0);
      }

      renderPublicationResults();
      setPublicationStatus(
        publicationSearchState.items.length
          ? 'Đã tìm thấy dữ liệu bài báo.'
          : 'Không tìm thấy kết quả phù hợp.',
        publicationSearchState.items.length ? 'success' : 'info'
      );
    } catch (error) {
      console.error('Publication search failed:', error);
      publicationSearchState.items = [];
      publicationSearchState.total = 0;
      if (publicationSearchResults) {
        publicationSearchResults.innerHTML =
          '<div class="publication-search-empty text-center">' +
          '<div class="text-danger mb-2">Không lấy được dữ liệu bài báo. Vui lòng thử lại.</div>' +
          '<div class="text-muted small">Bạn vẫn có thể nhập bài báo thủ công bằng liên kết phía dưới.</div>' +
          '</div>';
      }
      setPublicationStatus('');
      updatePublicationPager();
    }
  };

  if (paperSearchBtn) {
    paperSearchBtn.addEventListener('click', () => searchCrossref(1));
  }

  if (publicationSearchInput) {
    publicationSearchInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        searchCrossref(1);
      }
    });
  }

  if (publicationPrevPage) {
    publicationPrevPage.addEventListener('click', () => {
      if (publicationSearchState.page > 1) searchCrossref(publicationSearchState.page - 1);
    });
  }

  if (publicationNextPage) {
    publicationNextPage.addEventListener('click', () => {
      if (!publicationNextPage.disabled) searchCrossref(publicationSearchState.page + 1);
    });
  }

  const appendArticleToTable = item => {
    if (!item) return false;
    return upsertArticle({
      title:item.title,
      authors:item.authors,
      year:item.year,
      issn:item.issn,
      journal:item.journal,
      doi:item.doi,
      description:''
    });
  };

  if (publicationAddBtn) {
    publicationAddBtn.addEventListener('click', () => {
      const item = publicationSearchState.items[publicationSearchState.selectedIndex];
      if (!item) return;
      if (!appendArticleToTable(item)) return;
      bootstrap.Modal.getOrCreateInstance(publicationSearchModalEl).hide();
      toast('Đã thêm bài báo khoa học.');
    });
  }

  // Chuẩn hóa nội dung nhập: hạn chế lỗi Caps Lock / nhập toàn chữ hoa.
  const toSmartTitleCase = value => {
    const trimmed = String(value || '').trim().replace(/\s+/g,' ');
    if (!trimmed) return '';
    if (trimmed === trimmed.toUpperCase() && /[A-ZÀ-Ỹ]/.test(trimmed)) {
      return trimmed.toLocaleLowerCase('vi-VN').replace(/(^|[\s\-\/])([a-zà-ỹ])/g, (m,p1,p2) => p1 + p2.toLocaleUpperCase('vi-VN'));
    }
    return trimmed;
  };
  document.querySelectorAll('.smart-titlecase').forEach(input => {
    input.addEventListener('blur', () => input.value = toSmartTitleCase(input.value));
  });

  // Gợi ý Caps Lock ngay khi người dùng nhập.
  document.addEventListener('keydown', event => {
    if (!(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) return;
    const on = event.getModifierState && event.getModifierState('CapsLock');
    event.target.classList.toggle('capslock-on', Boolean(on));
    event.target.title = on ? 'Caps Lock đang bật' : '';
  });

  // Xem trước / xuất Word theo nhiều mẫu.
  const exportPreview = document.getElementById('exportPreview');
  const getCellRows = selector => [...document.querySelectorAll(selector+' tr:not(.empty-row)')].map(row => [...row.children].map(td => td.innerText.trim()));
  const getGeneralValue = name => document.querySelector('[name="'+name+'"]')?.value || '';

  const buildExportPreview = () => {
    if (!exportPreview) return;
    const template = document.querySelector('input[name="export_template"]:checked')?.value || 'standard';
    const education = getCellRows('#credentialBody');
    const work = getCellRows('#workBody');
    const projects = getCellRows('#projectBody');
    const articles = getCellRows('#articleBody');
    const textbooks = getCellRows('#textbookBody');

    let html = '<h3 class="text-center">LÝ LỊCH KHOA HỌC</h3>'+
      '<h5>I. LÝ LỊCH SƠ LƯỢC</h5>'+
      '<p><b>Họ và tên:</b> '+escapeHtml(getGeneralValue('person_name'))+'</p>'+
      '<p><b>Ngày sinh:</b> '+escapeHtml(getGeneralValue('person_dob'))+' &nbsp; <b>Nơi sinh:</b> '+escapeHtml(getGeneralValue('person_pob'))+'</p>'+
      '<p><b>Quê quán:</b> '+escapeHtml(getGeneralValue('person_hometown'))+' &nbsp; <b>Dân tộc:</b> '+escapeHtml(getGeneralValue('person_ethnicity'))+'</p>'+
      '<p><b>Chức vụ:</b> '+escapeHtml(getGeneralValue('person_position'))+'</p>'+
      '<p><b>Đơn vị công tác:</b> '+escapeHtml(getGeneralValue('person_work_unit'))+'</p>';

    const table = (title, rows) => {
      if (!rows.length) return '<h5>'+title+'</h5><p class="text-muted">Chưa có dữ liệu.</p>';
      return '<h5>'+title+'</h5><table><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+escapeHtml(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
    };

    html += table('II. QUÁ TRÌNH ĐÀO TẠO', education);
    html += table('III. QUÁ TRÌNH CÔNG TÁC', work);
    html += table('IV. QUÁ TRÌNH NGHIÊN CỨU KHOA HỌC - Đề tài', projects);
    html += table('Công bố khoa học', articles.map(r=>r.slice(0,6)));

    if (template === 'textbook' || template === 'full') html += table('Sách giáo trình', textbooks);
    if (template === 'award' || template === 'full') html += table('V. GIẢI THƯỞNG', getCellRows('#awardBody'));

    exportPreview.innerHTML = html;
  };

  document.getElementById('refreshExportPreview')?.addEventListener('click', buildExportPreview);
  document.querySelectorAll('input[name="export_template"]').forEach(r => r.addEventListener('change', buildExportPreview));
  document.getElementById('exportCvModal')?.addEventListener('shown.bs.modal', buildExportPreview);

  document.getElementById('downloadExportDoc')?.addEventListener('click', () => {
    buildExportPreview();
    const html = '<html><head><meta charset="utf-8"><style>body{font-family:Times New Roman;font-size:13pt}table{border-collapse:collapse;width:100%}td{border:1px solid #000;padding:5px}</style></head><body>'+exportPreview.innerHTML+'</body></html>';
    const blob = new Blob(['\ufeff', html], {type:'application/msword'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url;
    a.download='ly-lich-khoa-hoc.doc';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Đã tạo file Word theo mẫu đã chọn.');
  });

  // Cấu hình đồng bộ Google Sheet / Drive qua Apps Script Web App.
  const endpointInput = document.getElementById('googleSyncEndpoint');
  const folderInput = document.getElementById('googleDriveFolderId');
  const syncStatus = document.getElementById('googleSyncStatus');
  if (endpointInput) endpointInput.value = localStorage.getItem('google-sync-endpoint') || '';
  if (folderInput) folderInput.value = localStorage.getItem('google-drive-folder') || '';

  document.getElementById('saveGoogleSyncConfig')?.addEventListener('click', () => {
    localStorage.setItem('google-sync-endpoint', endpointInput?.value.trim() || '');
    localStorage.setItem('google-drive-folder', folderInput?.value.trim() || '');
    if (syncStatus) syncStatus.textContent='Đã lưu cấu hình trên trình duyệt.';
    toast('Đã lưu cấu hình đồng bộ.');
  });

  document.getElementById('syncProfileBtn')?.addEventListener('click', async () => {
    const endpoint = endpointInput?.value.trim();
    if (!endpoint) {
      toast('Cần nhập URL Web App Google Apps Script trước khi đồng bộ.', 'warning');
      return;
    }
    const payload = {
      folderId: folderInput?.value.trim() || '',
      general: Object.fromEntries([...document.querySelectorAll('#editGeneral [name]')].map(el=>[el.name, el.type==='radio' ? (el.checked?el.value:undefined) : el.value]).filter(([,v])=>v!==undefined)),
      education:getCellRows('#credentialBody'),
      work:getCellRows('#workBody'),
      projects:getCellRows('#projectBody'),
      articles:getCellRows('#articleBody').map(r=>r.slice(0,6)),
      seminar:getCellRows('#seminarBody'),
      textbooks:getCellRows('#textbookBody'),
      awards:getCellRows('#awardBody')
    };
    try {
      if (syncStatus) syncStatus.textContent='Đang đồng bộ...';
      const res = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload)});
      if (!res.ok) throw new Error('HTTP '+res.status);
      if (syncStatus) syncStatus.textContent='Đồng bộ thành công.';
      toast('Đã đồng bộ dữ liệu.');
    } catch(err) {
      console.error(err);
      if (syncStatus) syncStatus.textContent='Không đồng bộ được. Kiểm tra URL Web App và quyền truy cập.';
      toast('Đồng bộ thất bại. Kiểm tra cấu hình Google Apps Script.', 'danger');
    }
  });

  const savedArticleSearch = document.getElementById('savedArticleSearch');
  if (savedArticleSearch) {
    savedArticleSearch.addEventListener('input', () => {
      const keyword = savedArticleSearch.value.trim().toLowerCase();
      document.querySelectorAll('#articleBody tr:not(.empty-row)').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? '' : 'none';
      });
    });
  }

  const links = [...document.querySelectorAll('.sidebar a[href^="#"]')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, {rootMargin:'-35% 0px -55% 0px', threshold:0});
  sections.forEach(s => observer.observe(s));
});