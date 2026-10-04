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
  const toast = message => {
    const host = document.getElementById('toastHost');
    if (!host) return;
    host.innerHTML = '<div class="alert alert-success shadow">' + message + '</div>';
    setTimeout(() => host.innerHTML = '', 2200);
  };

  const closeModal = form => {
    const modalEl = form.closest('.modal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  };

  const removeEmpty = body => body?.querySelector('.empty-row')?.remove();

  const credentialForm = document.getElementById('credentialForm');
  if (credentialForm) credentialForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(credentialForm);
    const kind = fd.get('kind');
    const body = document.getElementById('credentialBody');
    removeEmpty(body);
    let level, major, year, detail;
    if (kind === 'title') {
      level = fd.get('title_level') || '';
      major = fd.get('title_major') || '';
      year = fd.get('title_year') || '';
      detail = 'Học hàm';
    } else {
      level = fd.get('degree_level') || '';
      major = fd.get('degree_major') || '';
      year = fd.get('degree_year') || '';
      detail = [fd.get('degree_institution') || '', fd.get('study_level') === 'undergraduate' ? 'Đại học' : 'Sau đại học'].filter(Boolean).join(' - ');
    }
    body.insertAdjacentHTML('beforeend', '<tr><td>'+level+'</td><td>'+major+'</td><td>'+year+'</td><td>'+detail+'</td></tr>');
    credentialForm.reset();
    if (degreeLevel) { degreeLevel.innerHTML='<option value="">Chọn học vị</option>'; degreeLevel.disabled=true; }
    closeModal(credentialForm);
    toast('Đã thêm thông tin đào tạo.');
  });

  const languageForm = document.getElementById('languageForm');
  if (languageForm) languageForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(languageForm);
    const certificate = fd.get('certificate') === 'Khác' ? (fd.get('certificate_other') || 'Khác') : (fd.get('certificate') || '');
    const body = document.getElementById('languageBody');
    removeEmpty(body);
    body.insertAdjacentHTML('beforeend', '<tr><td>'+fd.get('name')+'</td><td>'+fd.get('proficiency')+'</td><td>'+certificate+'</td></tr>');
    languageForm.reset();
    certOther?.classList.add('d-none');
    closeModal(languageForm);
    toast('Đã thêm ngoại ngữ.');
  });

  const workForm = document.getElementById('workForm');
  if (workForm) workForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(workForm);
    const body = document.getElementById('workBody');
    removeEmpty(body);
    body.insertAdjacentHTML('beforeend',
      '<tr><td>'+fd.get('start')+'</td><td>'+(fd.get('current') ? 'Hiện tại' : (fd.get('end') || ''))+
      '</td><td>'+fd.get('institution')+'</td><td>'+fd.get('position')+'</td><td>'+fd.get('description')+'</td></tr>');
    workForm.reset();
    if (workEndDate) workEndDate.disabled = false;
    closeModal(workForm);
    toast('Đã thêm quá trình công tác.');
  });

  const projectForm = document.getElementById('projectForm');
  if (projectForm) projectForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(projectForm);
    const body = document.getElementById('projectBody');
    removeEmpty(body);
    const stt = body.querySelectorAll('tr').length + 1;
    body.insertAdjacentHTML('beforeend',
      '<tr><td>'+stt+'</td><td>'+fd.get('title')+'</td><td>'+fd.get('start_year')+'</td><td>'+fd.get('end_year')+
      '</td><td>'+fd.get('level')+'</td><td>'+fd.get('position')+'</td><td>'+fd.get('budget')+'</td><td>'+fd.get('budget_unit')+'</td></tr>');
    projectForm.reset();
    closeModal(projectForm);
    toast('Đã thêm đề tài.');
  });

  const publicationForm = document.getElementById('publicationForm');
  if (publicationForm) publicationForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(publicationForm);
    const labels = {conference:'Hội thảo', special_report:'Báo cáo chuyên đề'};
    const body = document.getElementById('publicationBody');
    removeEmpty(body);
    const stt = body.querySelectorAll('tr').length + 1;
    const month = fd.get('published_month') || '';
    const year = month ? month.split('-')[0] : '';
    body.insertAdjacentHTML('beforeend',
      '<tr><td>'+stt+'</td><td>'+(labels[fd.get('type')] || '')+'</td><td>'+fd.get('title')+'</td><td>'+year+
      '</td><td>'+fd.get('location')+'</td><td>'+fd.get('description')+'</td></tr>');
    publicationForm.reset();
    closeModal(publicationForm);
    toast('Đã thêm công bố khoa học.');
  });

  const textbookForm = document.getElementById('textbookForm');
  if (textbookForm) textbookForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(textbookForm);
    const body = document.getElementById('publicationBody');
    removeEmpty(body);
    const stt = body.querySelectorAll('tr').length + 1;
    const month = fd.get('published_month') || '';
    const year = month ? month.split('-')[0] : '';
    body.insertAdjacentHTML('beforeend',
      '<tr><td>'+stt+'</td><td>Sách giáo trình</td><td>'+fd.get('title')+'</td><td>'+year+
      '</td><td>'+fd.get('publisher')+'</td><td>'+fd.get('description')+'</td></tr>');
    textbookForm.reset();
    closeModal(textbookForm);
    toast('Đã thêm sách giáo trình.');
  });

  const publicationSearchModalEl = document.getElementById('addPublication');
  const publicationManualModalEl = document.getElementById('addPublicationManual');
  const manualOpenBtn = document.getElementById('openManualPublication');
  const backToSearchBtn = document.getElementById('backToPublicationSearch');
  const paperSearchBtn = document.getElementById('paperSearchBtn');

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

  if (paperSearchBtn) {
    paperSearchBtn.addEventListener('click', () => {
      const q = document.getElementById('publicationSearch')?.value.trim();
      const results = document.getElementById('publicationSearchResults');
      const hint = document.getElementById('publicationSearchHint');

      if (!q) {
        if (hint) {
          hint.classList.remove('d-none');
          hint.textContent = 'Nhập DOI, link website hoặc tên bài báo để tìm.';
        }
        return;
      }

      if (hint) {
        hint.classList.remove('d-none');
        hint.innerHTML =
          '<div class="p-3 border rounded text-start">' +
          '<strong>Chưa kết nối nguồn tìm kiếm thật trên GitHub Pages.</strong><br>' +
          'Từ khóa: <span class="text-break">' + q.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) + '</span><br>' +
          '<button type="button" class="btn btn-link p-0 mt-2" id="searchToManual">Không thấy bài? Nhập thủ công</button>' +
          '</div>';

        document.getElementById('searchToManual')?.addEventListener('click', () => {
          switchPublicationModal(publicationSearchModalEl, publicationManualModalEl);
        });
      }
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