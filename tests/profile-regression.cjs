const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {parseHTML}=require('linkedom');
const {DOMParser,XMLSerializer}=require('@xmldom/xmldom');
const JSZip=require('jszip');
const {indexedDB}=require('fake-indexeddb');
const root=path.resolve(__dirname,'..');
// Add the standard browser conveniences absent in xmldom's Node DOM.
const proto=Object.getPrototypeOf(new DOMParser().parseFromString('<a/>','application/xml').documentElement);
if (!('children' in proto)) Object.defineProperty(proto,'children',{get(){return [...this.childNodes].filter(x=>x.nodeType===1);}});
proto.remove=function(){this.parentNode?.removeChild(this);};
const store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const tick=()=>new Promise(r=>setTimeout(r,100));
function app(account='test-a',gas=false) {
 const {window}=parseHTML(fs.readFileSync(path.join(root,'index.html'),'utf8'));
 const document=window.document;
 const query=document.querySelector.bind(document); document.querySelector=selector=>{try{return query(selector);}catch(err){err.message+=" selector="+selector;throw err;}};
 document.querySelectorAll('input').forEach(el=>{el.checked=el.hasAttribute('checked');el.disabled=el.hasAttribute('disabled');});
 document.querySelectorAll('form').forEach(form=>{
  form.reportValidity=()=>true;
  form.reset=()=>form.querySelectorAll('input,textarea').forEach(el=>{if(el.type==='checkbox')el.checked=false;else el.value='';});
  form.elements=new Proxy({}, {get:(_,key)=>form.querySelector('[name="'+key+'"]')});
 });
 const bootstrap={Modal:{getOrCreateInstance:()=>({show(){},hide(){}}),getInstance:()=>({hide(){}})},Toast:class {show(){}},Dropdown:{getOrCreateInstance:()=>({hide(){}})}};
 window.OneFormAuth={getSession:()=>({email:account+'@example.invalid',username:account})};
 window.GAS_USER=undefined; window.google=undefined;
 const props=new Map();
 if(gas) {
  window.GAS_USER={userId:account,email:account+'@example.invalid'};
  const runner={withSuccessHandler(fn){this.ok=fn;return this;},withFailureHandler(fn){this.fail=fn;return this;},loadTables(){const ok=this.ok;setTimeout(()=>ok({data:{}}),0);},saveTables(data){const ok=this.ok;setTimeout(()=>ok({ok:true}),0);},loadGeneral(){const ok=this.ok;setTimeout(()=>ok({data:props.get(account)||{}}),0);},saveGeneral(data){props.set(account,data);const ok=this.ok;setTimeout(()=>ok({ok:true}),0);}};
  window.google={script:{run:runner}};
 }
 const context={window,document,google:window.google,localStorage,bootstrap,console,URL,Blob,TextDecoder,indexedDB,JSZip,DOMParser,XMLSerializer,setTimeout,clearTimeout,Date,HTMLInputElement:window.HTMLInputElement,HTMLTextAreaElement:window.HTMLTextAreaElement,IntersectionObserver:class {observe(){}},confirm:()=>true,location:{href:'https://example.invalid'},FormData:class {constructor(form){this.data=new Map();form.querySelectorAll('[name]').forEach(el=>{if(el.type!=='checkbox'||el.checked)this.data.set(el.name,el.type==='checkbox'?'on':el.value);});}get(k){return this.data.get(k)||null;}}};
 const c=vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'ministry-export.js'),'utf8'),c);
 vm.runInContext(fs.readFileSync(path.join(root,'scientist.js'),'utf8'),c);
 document.dispatchEvent(new window.Event('DOMContentLoaded'));
 const get=s=>document.querySelector(s),set=(s,v)=>get(s).value=v;
 const event=(id,type)=>get('#'+id).dispatchEvent(new window.Event(type,{bubbles:true,cancelable:true}));
 return {window,document,get,set,event,c,props,exporter:window.MinistryExport};
}
(async()=>{
 const a=app();
 assert.equal(a.get('[name="person_name"]').value,'');assert.equal(a.get('[name="person_email"]').value,'');
 assert.equal(a.get('#authUsername').textContent,'test-a');assert.equal(a.get('#authEmail').textContent,'test-a@example.invalid');
 assert.equal(a.get('#welcomeName').textContent,'test-a');
 a.event('editGeneralBtn','click');a.set('[name="person_name"]','Nguyễn Văn Kiểm Thử');a.set('[name="person_email"]','test@example.invalid');
 a.event('editGeneral','submit');
 assert.equal(a.get('#welcomeName').textContent,'test-a','Greeting must use signed-in identity rather than editable profile name');
 assert.equal(JSON.parse(store.get('scientist-general-v2:email:test-a@example.invalid')).person_name,'Nguyễn Văn Kiểm Thử');
 assert.equal(a.get('[name="person_name"]').disabled,true);
 assert.equal(app().get('[name="person_name"]').value,'Nguyễn Văn Kiểm Thử');
 assert.equal(app('test-b').get('[name="person_name"]').value,'');
 const g=app('gas-a',true);await tick();g.event('editGeneralBtn','click');g.set('[name="person_name"]','Người dùng Apps Script');g.event('editGeneral','submit');await tick();assert.equal(g.props.get('gas-a').person_name,'Người dùng Apps Script');
 const workCount=()=>a.document.querySelectorAll('#workBody tr:not(.empty-row)').length;
 a.set('#workForm [name="start"]','2026-10-04');a.set('#workForm [name="end"]','2026-10-03');a.set('#workForm [name="institution"]','Đơn vị kiểm thử');a.event('workForm','submit');assert.equal(workCount(),0);
 a.set('#workForm [name="end"]','2026-10-04');a.event('workForm','submit');assert.equal(workCount(),0);
 a.set('#workForm [name="end"]','2026-10-05');a.event('workForm','submit');assert.equal(workCount(),1);
 const projectCount=()=>a.document.querySelectorAll('#projectBody tr:not(.empty-row)').length;
 a.set('#projectForm [name="title"]','Đề tài kiểm thử');a.set('#projectForm [name="start_year"]','2026-10-04');a.set('#projectForm [name="end_year"]','2026-10-03');a.event('projectForm','submit');assert.equal(projectCount(),0);
 a.set('#projectForm [name="end_year"]','2026-10-04');a.event('projectForm','submit');assert.equal(projectCount(),1);
 const input=a.get('#supportFile');
 let file=new Blob(['not pdf'],{type:'application/pdf'});file.name='gia.pdf';input.files=[file];a.event('supportForm','submit');await tick();assert.match(a.get('#toastHost').textContent,/Chỉ nhận tệp PDF hợp lệ/);
 file=new Blob(['%PDF-1.4\n% fixture'],{type:'application/pdf'});file.name='kiem-thu.pdf';input.files=[file];a.event('supportForm','submit');await tick();assert.match(a.get('#supportFileStatus').textContent,/kiem-thu.pdf/);
 const again=app();await tick();assert.match(again.get('#supportFileStatus').textContent,/kiem-thu.pdf/);
 const other=app('test-b');await tick();assert.doesNotMatch(other.get('#supportFileStatus').textContent,/kiem-thu.pdf/);
 const row=a.document.createElement('tr');Object.assign(row.dataset,{kind:'degree',level:'Tiến sĩ (PhD)',major:'Công nghệ thông tin',institution:'Trường kiểm thử',year:'2024',thesis:'Luận án kiểm thử'});a.get('#credentialBody').appendChild(row);
 const publication=a.document.createElement('tr');Object.assign(publication.dataset,{title:'Nghiên cứu kiểm thử',year:'2025',journal:'Tạp chí kiểm thử'});a.get('#articleBody').appendChild(publication);
 const out=path.resolve(root,'../qa-word');fs.mkdirSync(out,{recursive:true});
 const blob=await a.exporter.create();fs.writeFileSync(path.join(out,'populated.docx'),Buffer.from(await blob.arrayBuffer()));
 const empty=app('empty-account');const blank=await empty.exporter.create();fs.writeFileSync(path.join(out,'empty.docx'),Buffer.from(await blank.arrayBuffer()));
 const generated=await JSZip.loadAsync(Buffer.from(await blob.arrayBuffer())),original=await JSZip.loadAsync(fs.readFileSync(path.join(root,'LY_LICH_KHOA_HOC_MAU_CUA_BO.docx')));
 for(const name of Object.keys(original.files).filter(x=>!original.files[x].dir&&x!=='word/document.xml'))assert.deepEqual(await generated.file(name).async('nodebuffer'),await original.file(name).async('nodebuffer'),'Preserved DOCX part '+name);
 const blankZip=await JSZip.loadAsync(Buffer.from(await blank.arrayBuffer()));
 const serialize=xml=>new XMLSerializer().serializeToString(new DOMParser().parseFromString(xml,'application/xml'));
 assert.equal(serialize(await blankZip.file('word/document.xml').async('string')),serialize(await original.file('word/document.xml').async('string')),'Blank standard export must retain every original template paragraph, tab, table and signature style');
 const xml=await generated.file('word/document.xml').async('string');assert.match(xml,/Nguyễn Văn Kiểm Thử/);assert.match(xml,/Nghiên cứu kiểm thử/);assert.doesNotMatch(xml,/managed-edit|Chưa có dữ liệu|Han Han/);
 const preview=await a.exporter.preview();assert.match(preview,/CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/);
 assert.match(preview,/font-weight:700/);assert.match(preview,/display:inline-flex/);assert.match(preview,/class="ministry-leader"/);assert.match(preview,/display:flex;flex-wrap:nowrap/);assert.match(preview,/BM04\/QT03\/ĐT/);
 const previewDoc=parseHTML(preview).document;
 for(const label of ['Chức vụ (hiện tại','Chỗ ở riêng','Thạc sĩ chuyên ngành','Tiến sĩ chuyên ngành','Tên luận án']){const paragraph=[...previewDoc.querySelectorAll('p')].find(p=>p.textContent.includes(label));assert.ok(paragraph,label);assert.match(paragraph.getAttribute('style'),/flex-wrap:nowrap/);assert.equal(paragraph.querySelectorAll('br').length,0);assert.ok(paragraph.querySelector('.ministry-leader'));}
const previewTables=[...previewDoc.querySelectorAll('table')];
 assert.equal(previewTables.length,5);
 for(const table of previewTables.slice(1,4))for(const cell of table.querySelectorAll('td'))assert.match(cell.getAttribute('style'),/border:1px solid #000/,'Every ministry table cell needs its border');
 for(const cell of previewTables[4].querySelectorAll('td'))assert.match(cell.getAttribute('style'),/border:0;/,'Signature must have no frame');
 const fullPreview=parseHTML(await a.exporter.preview('full')).document;
 assert.equal([...fullPreview.querySelectorAll('table')].filter(t=>t.querySelector('td[style*="border:1px solid #000"]')).length,5,'Both added sections need grid lines');
 for(const f of ['scientist.css','google-apps-script/Styles.html'])assert.match(fs.readFileSync(path.join(root,f),'utf8'),/font-family:"Times New Roman",Times,serif!important/);

 for(const file of ['index.html','google-apps-script/Index.html']){const html=fs.readFileSync(path.join(root,file),'utf8');assert.equal((html.match(/name="exportTemplateChoice"/g)||[]).length,4,'Four visible export choices in '+file);}

 const tableWriter=app('table-test');
 tableWriter.set('#workForm [name="start"]','2026-10-04');tableWriter.set('#workForm [name="end"]','2026-10-05');tableWriter.set('#workForm [name="institution"]','Đơn vị kiểm thử');tableWriter.event('workForm','submit');
 await new Promise(resolve=>setTimeout(resolve,650));
 const tables=JSON.parse(store.get('scientist-tables-v3:email:table-test@example.invalid')||'{}');
 assert.equal(tables.workBody?.[0]?.data.institution,'Đơn vị kiểm thử');
 const tableReload=app('table-test');assert.equal(tableReload.document.querySelectorAll('#workBody tr:not(.empty-row)').length,1);
 tableReload.get('#workBody .managed-edit-btn').dispatchEvent(new tableReload.window.Event('click',{bubbles:true}));
 assert.equal(tableReload.get('#workForm [name="institution"]').value,'Đơn vị kiểm thử');
 const tableOther=app('other-account');assert.equal(tableOther.document.querySelectorAll('#workBody tr:not(.empty-row)').length,0);
 const variants=app('variant-test');variants.set('[name="person_name"]','Nguyễn Văn Kiểm Thử');
 for(const [body,data] of [['textbookBody',{title:'Giáo trình công nghệ thông tin',year:'2025',publisher:'Nhà xuất bản Giáo dục',description:'Chủ biên'}],['awardBody',{category:'Giải thưởng',name:'Giải thưởng nghiên cứu khoa học',year:'2026',organization:'Trường Đại học',description:'Thành tích xuất sắc'}]]) {
   const row=variants.document.createElement('tr');Object.assign(row.dataset,data);variants.get('#'+body).appendChild(row);
 }
 const variantOut=path.resolve(root,'../qa-export-variants');fs.mkdirSync(variantOut,{recursive:true});
 for(const variant of ['standard','textbooks','awards','full']) {
   const file=await variants.exporter.create(variant),buffer=Buffer.from(await file.arrayBuffer());
   fs.writeFileSync(path.join(variantOut,variant+'.docx'),buffer);
   const zip=await JSZip.loadAsync(buffer),xml=await zip.file('word/document.xml').async('string');
   assert.equal(xml.includes('3. Sách và giáo trình'),['textbooks','full'].includes(variant));
   assert.equal(xml.includes('V. GIẢI THƯỞNG VÀ THÀNH TÍCH'),['awards','full'].includes(variant));
   assert.equal(xml.includes('Giáo trình công nghệ thông tin'),['textbooks','full'].includes(variant));
   assert.equal(xml.includes('Giải thưởng nghiên cứu khoa học'),['awards','full'].includes(variant));
   assert.equal((await variants.exporter.preview(variant)).includes('GIẢI THƯỞNG VÀ THÀNH TÍCH'),['awards','full'].includes(variant));
 }
 console.log('PASS: personal save/reload/account isolation, GAS save, date bounds, PDF validation/persistence/isolation, exact DOCX template parts and data.');
})().catch(err=>{console.error(err);process.exitCode=1;});
