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

  const sortRowsByNumericColumn = (body, columnIndex, unfinishedOnTop=false) => {
    if (!body) return;
    const rows = [...body.querySelectorAll('tr:not(.empty-row)')];
    rows.sort((a,b) => {
      const av = a.dataset.sortYear ? Number(a.dataset.sortYear) : Number((a.children[columnIndex]?.textContent || '').match(/\d{4}/)?.[0] || 0);
      const bv = b.dataset.sortYear ? Number(b.dataset.sortYear) : Number((b.children[columnIndex]?.textContent || '').match(/\d{4}/)?.[0] || 0);
      return bv - av;
    });
    rows.forEach(row => body.appendChild(row));
  };

  const credentialForm = document.getElementById('credentialForm');
  if (credentialForm) credentialForm.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(credentialForm);
    const kind = fd.get('kind');
    const body = document.getElementById('credentialBody');
    removeEmpty(body);
    let level='', major='', year='', detail='', sortYear=0;

    if (kind === 'title') {
      level = fd.get('title_level') || '';
      major = fd.get('title_major') || '';
      year = fd.get('title_year') || '';
      if (year && Number(year) > currentYear) {
        toast('Năm phong không được vượt quá năm hiện tại.', 'warning');
        return;
      }
      sortYear = Number(year || 0);
      detail = 'Học hàm';
    } else {
      level = fd.get('degree_level') || '';
      major = fd.get('degree_major') || '';
      const notGraduated = fd.get('degree_not_graduated') === 'on';
      const rawYear = fd.get('degree_year') || '';
      if (!notGraduated && rawYear && Number(rawYear) > currentYear) {
        toast('Năm tốt nghiệp không được vượt quá năm hiện tại. Nếu chưa tốt nghiệp, hãy chọn “Chưa tốt nghiệp”.', 'warning');
        return;
      }
      year = notGraduated ? 'Chưa tốt nghiệp' : rawYear;
      sortYear = notGraduated ? currentYear + 1 : Number(rawYear || 0);
      const thesis = fd.get('degree_thesis') || '';
      const institution = fd.get('degree_institution') || '';
      detail = [thesis, institution].filter(Boolean).join(' — ');
    }

    const tr = document.createElement('tr');
    tr.dataset.sortYear = String(sortYear);
    tr.innerHTML = '<td>'+escapeHtml(level)+'</td><td>'+escapeHtml(major)+'</td><td>'+escapeHtml(year)+'</td><td>'+escapeHtml(detail)+'</td>';
    body.appendChild(tr);
    sortRowsByNumericColumn(body, 2, true);

    credentialForm.reset();
    if (degreeLevel) {
      degreeLevel.innerHTML='<option value="">Chọn học vị</option>';
      degreeLevel.disabled=true;
    }
    if (degreeYear) degreeYear.disabled=false;
    updateDegreeThesisLabel();
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
      if (row.children[0]) row.children[0].textContent = String(index + 1);
    });
  };

  const addArticleActions = row => {
    row.querySelector('.article-delete-btn')?.addEventListener('click', () => {
      const key = row.dataset.articleKey;
      if (confirm('Xóa bài báo này khỏi hồ sơ?')) {
        publicationEvidenceFiles.delete(key);
        row.remove();
        renumberArticleRows();
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
      '<td></td>'+
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

    sortRowsByNumericColumn(body, 3);
    renumberArticleRows();
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