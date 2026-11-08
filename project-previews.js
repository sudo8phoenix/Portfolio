'use strict';

// Small, local demonstrations: the case studies retain the full workflow.
function projectPreview(id, kind, name, markup, setup) {
  const project = document.getElementById(id);
  const workflow = project?.querySelector('[data-workflow]');
  if (!workflow) return;
  const preview = document.createElement('section');
  preview.className = `project-preview preview-${kind}`;
  preview.setAttribute('aria-label', `${name} interactive preview`);
  preview.innerHTML = `<div class="preview-heading"><span>${name}</span><span>Interactive sample</span></div>${markup}`;
  setup(preview);
  workflow.before(preview);
  workflow.hidden = true;
}

projectPreview('project-invochain', 'chain', 'InvoChain', `
  <div class="preview-scene">
    <div class="preview-toolbar"><span>INVOICE / 001</span><button type="button" data-verify>Verify invoice ↗</button></div>
    <div class="preview-invoice">
      <div class="preview-document-head"><span>INVOCHAIN</span><span>0.05 ETH</span></div>
      <p class="preview-invoice-title">Traceable<br>by design.</p>
      <dl><div><dt>Document</dt><dd>PDF → IPFS</dd></div><div><dt>Payment</dt><dd data-payment>Unpaid · 0.05 ETH</dd></div><div><dt>Identity</dt><dd data-identity>Awaiting verification</dd></div></dl>
      <span class="preview-stamp" data-stamp>SAMPLE RECORD</span>
    </div>
    <div class="invoice-inspect" aria-label="Inspect invoice details">${['Document', 'Identity', 'Payment'].map((label, i) => `<button type="button" data-inspect="${i}" aria-pressed="${i === 0}">${label}</button>`).join('')}</div>
    <div class="invoice-detail"><strong data-detail-title></strong><p data-detail-copy></p><button type="button" data-pay hidden>Simulate payment · 0.05 ETH</button></div>
  </div><p class="preview-feedback" role="status">Inspect the document, verify the identity, then try a payment.</p>
  <p class="preview-note">Interactive sample · no wallet or real transaction</p>`, preview => {
  let verified = false, paid = false, active = 0;
  const verify = preview.querySelector('[data-verify]');
  function render() {
    preview.classList.toggle('is-verified', verified);
    verify.textContent = verified ? 'Reset invoice ↺' : 'Verify invoice ↗';
    preview.querySelector('[data-identity]').textContent = verified ? 'Sample signature verified ✓' : 'Awaiting verification';
    preview.querySelector('[data-payment]').textContent = paid ? 'Paid · 0.05 ETH ✓' : 'Unpaid · 0.05 ETH';
    preview.querySelector('[data-stamp]').textContent = paid ? '✓ SAMPLE PAID' : verified ? '✓ SAMPLE VERIFIED' : 'SAMPLE RECORD';
    const details = [
      ['Invoice_001.pdf', 'A generated PDF is stored through IPFS. Its content ID links the document to this invoice.'],
      [verified ? 'Signature verified ✓' : 'Who controls this wallet?', verified ? 'The sample nonce and signature match the invoice recipient. You can now try a payment.' : 'Verify the invoice to simulate checking a wallet signature against a one-time nonce.'],
      [paid ? 'Payment recorded ✓' : '0.05 ETH · awaiting payment', paid ? 'The sample transaction is confirmed. Invoice #001 is marked paid and its document stays linked.' : verified ? 'Identity checked. Simulate a confirmed transaction to update this invoice.' : 'Verify the sample identity before simulating a payment.']
    ];
    preview.querySelector('[data-detail-title]').textContent = details[active][0];
    preview.querySelector('[data-detail-copy]').textContent = details[active][1];
    preview.querySelector('[data-pay]').hidden = active !== 2 || !verified || paid;
    preview.querySelectorAll('[data-inspect]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.inspect) === active)));
  }
  preview.querySelectorAll('[data-inspect]').forEach(button => button.addEventListener('click', () => { active = Number(button.dataset.inspect); render(); }));
  verify.addEventListener('click', () => {
    verified = !verified; paid = false; active = verified ? 1 : 0; render();
    preview.querySelector('.preview-feedback').textContent = verified ? 'Identity verified ✓ Select Payment to continue.' : 'Invoice reset. Inspect the document or verify again.';
  });
  preview.querySelector('[data-pay]').addEventListener('click', () => {
    if (!verified || paid) return;
    paid = true; render();
    preview.querySelector('.preview-feedback').textContent = 'Payment confirmed ✓ Sample invoice #001 is now paid.';
    preview.querySelector('[data-inspect="2"]').focus();
  });
  render();
});

projectPreview('project-fridge-vision', 'vision', 'Fridge Vision', `
  <div class="preview-scene">
    <div class="preview-toolbar"><span data-count>3 INGREDIENTS</span><button type="button" data-rescan>Rescan sample ↺</button></div>
    <div class="preview-detections" aria-label="Correct the sample ingredients">
      ${['Tomato', 'Egg', 'Carrot'].map((name, i) => `<button type="button" class="preview-detection detection-${i}" data-food="${name}" aria-pressed="true"><span class="food-drawing drawing-${name.toLowerCase()}" aria-hidden="true"></span><strong>${name}</strong><span class="detection-caption">✓ Detected</span></button>`).join('')}
    </div>
    <p class="preview-flow">IMAGE → INGREDIENTS → RECIPES</p>
  </div><p class="preview-feedback" role="status">On the menu: vegetable omelette.</p>
  <p class="preview-note">Tap an ingredient to correct it · preset recipe suggestions</p>`, preview => {
  const selected = new Set(['Tomato', 'Egg', 'Carrot']);
  const buttons = [...preview.querySelectorAll('[data-food]')];
  function render() {
    buttons.forEach(button => {
      const active = selected.has(button.dataset.food);
      button.setAttribute('aria-pressed', String(active));
      button.querySelector('.detection-caption').textContent = active ? '✓ Detected' : preview.classList.contains('is-scanning') ? 'Locating…' : '+ Add back';
    });
    preview.querySelector('[data-count]').textContent = `${selected.size} INGREDIENT${selected.size === 1 ? '' : 'S'}`;
    let recipe = selected.has('Egg') ? (selected.size > 1 ? 'vegetable omelette' : 'scrambled eggs') : selected.size > 1 ? 'tomato & carrot salad' : selected.has('Tomato') ? 'fresh tomato salad' : 'roasted carrots';
    preview.querySelector('.preview-feedback').textContent = selected.size ? `On the menu: ${recipe}.` : 'Nothing selected. Add an ingredient to find a recipe.';
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.food;
    selected.has(name) ? selected.delete(name) : selected.add(name);
    render();
  }));
  const rescan = preview.querySelector('[data-rescan]');
  rescan.addEventListener('click', () => {
    selected.clear(); render(); rescan.disabled = true;
    rescan.textContent = 'Scanning…'; preview.classList.add('is-scanning');
    buttons.forEach(button => { button.disabled = true; button.querySelector('.detection-caption').textContent = 'Locating…'; });
    preview.querySelector('.preview-feedback').textContent = 'Scanning the sample. Looking for ingredients…';
    buttons.forEach((button, index) => setTimeout(() => {
      selected.add(button.dataset.food); render();
      preview.querySelector('.preview-feedback').textContent = `Identified ${button.dataset.food.toLowerCase()} · ${selected.size} of 3 ingredients.`;
      if (index === buttons.length - 1) {
        preview.classList.remove('is-scanning'); rescan.disabled = false; rescan.textContent = 'Rescan sample ↺';
        buttons.forEach(item => { item.disabled = false; });
        preview.querySelector('.preview-feedback').textContent = 'Scan complete ✓ 3 ingredients highlighted. Try a vegetable omelette.';
      }
    }, 450 + index * 500));
  });
  render();
});

projectPreview('project-time-agent', 'time', 'Time Agent', `
  <div class="preview-scene">
    <div class="preview-toolbar"><span>SITE REPORT / LEVEL 2</span><button type="button" data-reset-report>Reset review ↺</button></div>
    <div class="preview-report"><span class="preview-document-head">TODAY’S PROGRESS</span><strong>12 <span>window frames</span></strong><blockquote>“Installed 12 window frames on Level 2.”</blockquote><div class="report-connection"><span>Source report</span><span aria-hidden="true">→</span><span data-record>Awaiting review</span></div></div>
    <div class="progress-ledger"><div><span>LEVEL 2 / RECORDED PROGRESS</span><strong data-ledger-count>0 / 12 frames</strong></div><div class="frame-grid" aria-hidden="true">${'<i></i>'.repeat(12)}</div><p data-ledger-note>12 proposed frames are waiting for your review.</p></div>
    <div class="preview-decisions"><button type="button" data-decision="approve">Approve update ✓</button><button type="button" data-decision="revise">Request revision</button></div>
    <form class="revision-form" hidden><label for="revision-reason">What needs another look?</label><select id="revision-reason"><option>The quantity needs checking</option><option>The level does not match</option><option>More source evidence needed</option></select><button type="submit">Send revision request →</button></form>
  </div><p class="preview-feedback" role="status">Review the report, then decide what enters the record.</p><p class="preview-note">Local demonstration · reset to try another decision</p>`, preview => {
  const form = preview.querySelector('.revision-form');
  const approve = preview.querySelector('[data-decision="approve"]');
  const revise = preview.querySelector('[data-decision="revise"]');
  function render(decision = '') {
    preview.dataset.decision = decision;
    const approved = decision === 'approve';
    form.hidden = decision !== 'editing';
    approve.disabled = approved || decision === 'revise';
    approve.textContent = approved ? 'Update approved ✓' : 'Approve update ✓';
    revise.disabled = approved || decision === 'revise';
    revise.textContent = decision === 'revise' ? 'Revision sent ✓' : 'Request revision';
    preview.querySelector('[data-record]').textContent = approved ? '+12 frames recorded ✓' : decision === 'revise' ? 'Revision requested' : 'Awaiting review';
    preview.querySelector('[data-ledger-count]').textContent = approved ? '12 / 12 frames ✓' : '0 / 12 frames';
    preview.querySelector('[data-ledger-note]').textContent = approved ? 'Recorded with its source: today’s Level 2 site report.' : decision === 'revise' ? 'No frames recorded. The report is back with the author.' : '12 proposed frames are waiting for your review.';
    preview.querySelector('.preview-feedback').textContent = approved ? 'Approved ✓ All 12 frames are now in the sample progress record.' : decision === 'revise' ? `Revision sent: ${form.querySelector('select').value}.` : decision === 'editing' ? 'Choose a reason to send back with the report.' : 'Review the report, then decide what enters the record.';
  }
  approve.addEventListener('click', () => { render('approve'); preview.querySelector('[data-reset-report]').focus({preventScroll:true}); });
  revise.addEventListener('click', () => { render('editing'); form.querySelector('select').focus({preventScroll:true}); });
  form.addEventListener('submit', event => { event.preventDefault(); render('revise'); preview.querySelector('[data-reset-report]').focus({preventScroll:true}); });
  preview.querySelector('[data-reset-report]').addEventListener('click', () => { form.reset(); render(); });
  render();
});

projectPreview('project-voice-rag', 'rag', 'Voice-Based RAG', `
  <div class="preview-scene"><div class="preview-toolbar"><span>HANDBOOK.PDF</span><span class="preview-stamp">SOURCE LINKED</span></div>
    <div class="rag-questions" aria-label="Choose a sample question"><button type="button" data-query="0" aria-pressed="true">Expense claims</button><button type="button" data-query="1" aria-pressed="false">Time off</button><button type="button" data-query="2" aria-pressed="false">Remote work</button></div>
    <div class="rag-answer"><span class="preview-document-head">ASK YOUR DOCUMENTS</span><strong data-question></strong><p data-answer></p><span class="rag-citation" data-citation></span></div>
  </div><p class="preview-feedback" role="status">Expense question selected. The answer keeps its source.</p><p class="preview-note">Preset handbook examples · no model or microphone required</p>`, preview => {
  const samples = [
    ['How do I submit an expense?', 'Attach your receipt and business purpose in the expense portal.', 'Expense policy · passage 02', 'Expense'],
    ['How do I request time off?', 'Send a request through the leave portal for your manager to review.', 'Leave policy · passage 05', 'Time off'],
    ['Where can I find remote work guidance?', 'Check the team handbook and agree on working hours with your manager.', 'Working arrangements · passage 08', 'Remote work']
  ];
  function render(index) {
    const [question, answer, citation, label] = samples[index];
    preview.querySelector('[data-question]').textContent = question;
    preview.querySelector('[data-answer]').textContent = answer;
    preview.querySelector('[data-citation]').textContent = citation;
    preview.querySelectorAll('[data-query]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.query) === index)));
    preview.querySelector('.preview-feedback').textContent = `${label} question selected. The answer keeps its source.`;
  }
  preview.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => render(Number(button.dataset.query))));
  render(0);
});

// Desktop navigation uses balanced columns; the active marker also follows resizing.
const previewHeader = document.querySelector('.header');
if (previewHeader && 'ResizeObserver' in window) {
  let headerWidth = 0;
  new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (width === headerWidth) return;
    headerWidth = width;
    window.dispatchEvent(new Event('resize'));
  }).observe(previewHeader);
}
