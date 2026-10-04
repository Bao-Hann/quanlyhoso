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
    const body = document.getElementById('articleBody');
    removeEmpty(body);
    const stt = body.querySelectorAll('tr').length + 1;
    const month = fd.get('published_month') || '';
    const year = month ? month.split('-')[0] : '';
    body.insertAdjacentHTML('beforeend',
      '<tr><td>'+stt+'</td><td>'+fd.get('title')+'</td><td>'+year+
      '</td><td>'+fd.get('location')+'</td><td>'+fd.get('doi_or_url')+'</td><td>'+fd.get('description')+'</td></tr>');
    publicationForm.reset();
    closeModal(publicationForm);
    toast('Đã thêm bài báo khoa học.');
  });

  const seminarForm = document.getElementById('seminarForm');
  if (seminarForm) seminarForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(seminarForm);
    const body = document.getElementById('seminarBody');
    removeEmpty(body);
    const stt = body.querySelectorAll('tr').length + 1;
    const month = fd.get('month') || '';
    const year = fd.get('year') || '';
    const published = [month, year].filter(Boolean).join('/');
    body.insertAdjacentHTML('beforeend',
      '<tr><td>'+stt+'</td><td>'+fd.get('title')+'</td><td>'+published+
      '</td><td>'+fd.get('publisher')+'</td><td>'+fd.get('publication_type')+
      '</td><td>'+fd.get('description')+'</td></tr>');
    seminarForm.reset();
    closeModal(seminarForm);
    toast('Đã thêm Seminar - Hội thảo.');
  });

  const textbookForm = document.getElementById('textbookForm');
  if (textbookForm) textbookForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(textbookForm);
    const body = document.getElementById('textbookBody');
    removeEmpty(body);
    const stt = body.querySelectorAll('tr').length + 1;
    const month = fd.get('month') || '';
    const year = fd.get('year') || '';
    const published = [month, year].filter(Boolean).join('/');
    body.insertAdjacentHTML('beforeend',
      '<tr><td>'+stt+'</td><td>'+fd.get('title')+'</td><td>'+published+
      '</td><td>'+fd.get('publisher')+'</td><td></td><td>'+fd.get('description')+'</td></tr>');
    textbookForm.reset();
    closeModal(textbookForm);
    toast('Đã thêm sách giáo trình.');
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
    const body = document.getElementById('articleBody');
    if (!body || !item) return;
    removeEmpty(body);
    const stt = body.querySelectorAll('tr:not(.empty-row)').length + 1;
    body.insertAdjacentHTML('beforeend',
      '<tr>' +
      '<td>'+stt+'</td>' +
      '<td>'+escapeHtml(item.title)+'</td>' +
      '<td>'+escapeHtml(item.authors)+'</td>' +
      '<td>'+escapeHtml(item.year)+'</td>' +
      '<td>'+escapeHtml(item.issn)+'</td>' +
      '<td>'+escapeHtml(item.journal)+'</td>' +
      '</tr>');
  };

  if (publicationAddBtn) {
    publicationAddBtn.addEventListener('click', () => {
      const item = publicationSearchState.items[publicationSearchState.selectedIndex];
      if (!item) return;
      appendArticleToTable(item);
      bootstrap.Modal.getOrCreateInstance(publicationSearchModalEl).hide();
      toast('Đã thêm bài báo khoa học.');
    });
  }

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