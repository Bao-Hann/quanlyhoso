document.addEventListener('DOMContentLoaded', () => {
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

  document.querySelectorAll('[data-bs-target="#addCredential"][data-kind]').forEach(el => {
    el.addEventListener('click', () => {
      const kind = el.dataset.kind;
      document.getElementById('credentialKind').value = kind;
      const title = document.querySelector('#addCredential .modal-title');
      title.textContent = kind === 'title' ? 'Thêm học hàm' : 'Thêm học vị';
    });
  });

  document.querySelectorAll('.pub-type').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('publicationType').value = el.dataset.type;
      const labels = {article:'Thêm bài báo khoa học', seminar:'Thêm Seminar - Hội thảo', textbook:'Thêm sách giáo trình'};
      document.querySelector('#addPublication .modal-title').textContent = labels[el.dataset.type] || 'Thêm công bố khoa học';
    });
  });

  const awardCategory = document.getElementById('awardCategory');
  if (awardCategory) {
    awardCategory.addEventListener('change', () => {
      const transfer = awardCategory.value === 'tech_transfer';
      document.getElementById('awardName').placeholder = transfer ? 'Tên công nghệ/giải pháp' : 'Tên giải thưởng';
      document.getElementById('awardOrg').placeholder = transfer ? 'Nơi áp dụng' : 'Nơi cấp';
      document.getElementById('awardYear').placeholder = transfer ? 'Năm chuyển giao' : 'Năm cấp';
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

  setTimeout(() => document.querySelectorAll('.alert').forEach(a => a.remove()), 3500);
});
