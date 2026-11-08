'use strict';
// These examples run entirely in the browser and never submit real transactions or model requests.
const quickReview = document.querySelector('[data-quick-review]');
if (quickReview) {
  const approve = quickReview.querySelector('[data-quick-approve]');
  const reset = quickReview.querySelector('[data-quick-reset]');
  const result = quickReview.querySelector('.quick-result');
  approve.addEventListener('click', () => {
    result.textContent = 'Approved in this example. The record now includes 12 frames and its source.';
    quickReview.dataset.approved = 'true';
    approve.hidden = true; reset.hidden = false; reset.focus();
  });
  reset.addEventListener('click', () => {
    result.textContent = 'The progress record stays unchanged until you approve.';
    delete quickReview.dataset.approved;
    reset.hidden = true; approve.hidden = false; approve.focus();
  });
}

function controls(panel, markup) {
  const box = document.createElement('div');
  box.className = 'example-controls'; box.innerHTML = markup; panel.append(box); return box;
}
function setCopy(panel, text, description) {
  panel.querySelector('.artifact').textContent = text;
  if (description) panel.querySelector('.panel-description').textContent = description;
}
function setStamp(panel, text) {
  const stamp = panel.querySelector('.visual-stamp'); if (stamp) stamp.textContent = text;
}
for (const workflow of document.querySelectorAll('[data-workflow]')) {
  const name = workflow.querySelector('.workflow-name').textContent;
  const panels = [...workflow.querySelectorAll('.workflow-panel')];
  if (panels.length !== 4) continue;
  workflow.classList.add('playground');
  workflow.querySelector('.example-label').textContent = 'Interactive example · local only';
  // Keep one sentence under each illustration; its source and state remain in the visual.
  panels.forEach(panel => { panel.querySelector('.panel-label').hidden = true; });
  if (/Time Agent/i.test(name)) {
    let approved = false;
    const box = controls(panels[2], '<p class="control-prompt">You’re the reviewer. Does the proposed update match the report?</p><div class="choice-actions"><button type="button" data-approve>Approve 12 frames</button><button type="button" data-revise>Request revision</button></div><p class="choice-result" role="status">No decision yet. The record is unchanged.</p>');
    const feedback = box.querySelector('.choice-result');
    const update = () => {
      setCopy(panels[3], approved ? '+12 frames · source retained' : 'No approved update yet', approved ? 'Your example decision added 12 frames to the progress record.' : 'Go to Review to approve the proposal before recording progress.');
      panels[3].querySelector('.panel-label').textContent = approved ? 'Approved example' : 'Awaiting review';
      setStamp(panels[3], approved ? '✓ APPROVED BY YOU' : 'AWAITING YOUR REVIEW');
    };
    box.querySelector('[data-approve]').addEventListener('click', () => { approved = true; feedback.textContent = 'Approved. Open Ledger to see the recorded update.'; setStamp(panels[2], '✓ APPROVED BY YOU'); update(); });
    box.querySelector('[data-revise]').addEventListener('click', () => { approved = false; feedback.textContent = 'Revision requested. No progress was recorded.'; setStamp(panels[2], 'REVISION REQUESTED'); update(); });
    workflow.addEventListener('workflow-reset', () => { approved = false; feedback.textContent = 'No decision yet. The record is unchanged.'; setStamp(panels[2], 'AWAITING HUMAN REVIEW'); update(); });
    update();
  } else if (/Invo/i.test(name)) {
    let verified = false, paid = false;
    const identity = controls(panels[0], '<div class="choice-actions"><button type="button" data-verify>Verify sample wallet</button><button type="button" data-disconnect>Reset wallet</button></div><p class="choice-result" role="status">Sample wallet is unverified. No wallet connection required.</p>');
    const payment = controls(panels[3], '<div class="choice-actions"><button type="button" data-pay>Record sample payment</button></div><p class="choice-result" role="status">Verify the sample wallet in Identity first.</p>');
    const pay = payment.querySelector('[data-pay]');
    function render() {
      pay.disabled = !verified || paid;
      setStamp(panels[0], verified ? '✓ SAMPLE VERIFIED' : 'UNVERIFIED SAMPLE');
      setCopy(panels[0], verified ? 'Sample wallet verified' : 'Prove who controls the wallet', 'Try a simulated signature check. No real wallet or signature is used.');
      setCopy(panels[3], paid ? 'Sample payment recorded · 0.05 ETH' : 'Invoice #001 · awaiting payment', 'An illustrative transaction only. No funds move.');
      setStamp(panels[3], paid ? '✓ SAMPLE RECORDED' : 'AWAITING PAYMENT');
      payment.querySelector('.choice-result').textContent = paid ? 'Example invoice marked paid. Reset the wallet to try again.' : verified ? 'Sample wallet verified. You can record the example payment.' : 'Verify the sample wallet in Identity first.';
    }
    identity.querySelector('[data-verify]').addEventListener('click', () => { verified = true; identity.querySelector('.choice-result').textContent = 'Sample signature accepted. Open Payment to continue.'; render(); });
    identity.querySelector('[data-disconnect]').addEventListener('click', () => { verified = paid = false; identity.querySelector('.choice-result').textContent = 'Example reset. Sample wallet is unverified.'; render(); });
    workflow.addEventListener('workflow-reset', () => identity.querySelector('[data-disconnect]').click());
    pay.addEventListener('click', () => { if (verified) { paid = true; render(); } }); render();
  } else if (/Fridge/i.test(name)) {
    const selected = new Set(['Tomato', 'Egg', 'Cheese']);
    const box = controls(panels[1], '<p class="control-prompt">Correct the sample detections. What’s in your fridge?</p><div class="ingredient-choices">'+['Tomato','Egg','Cheese'].map(item => '<button type="button" aria-pressed="true" data-ingredient="'+item+'">'+item+'</button>').join('')+'</div><p class="choice-result" role="status"></p>');
    function render() {
      const ingredients = [...selected];
      const recipe = selected.has('Egg') ? (selected.has('Tomato') ? 'Tomato omelette' : selected.has('Cheese') ? 'Cheese omelette' : 'Simple scrambled eggs') : selected.has('Tomato') && selected.has('Cheese') ? 'Tomato & cheese salad' : selected.has('Tomato') ? 'Fresh tomato salad' : selected.has('Cheese') ? 'Cheese snack plate' : 'Choose an ingredient to get started';
      setCopy(panels[1], ingredients.length ? ingredients.join(' · ') : 'No ingredients selected', 'Toggle the detections below to correct the example.');
      setCopy(panels[2], ingredients.length ? 'Matching: ' + ingredients.join(' + ') : 'No ingredients to match', 'Your selection determines the sample recipe suggestion.');
      setCopy(panels[3], recipe, ingredients.length ? 'A preset recipe suggestion based on your selection, not live inference.' : 'Return to Detect and select what you have.');
      box.querySelector('.choice-result').textContent = ingredients.length + ' ingredients selected. Open Cook to see your suggestion.';
      panels.forEach(panel => panel.querySelectorAll('.food').forEach(food => { food.classList.toggle('ingredient-removed', !selected.has(food.querySelector('small').textContent)); }));
    }
    box.querySelectorAll('[data-ingredient]').forEach(button => button.addEventListener('click', () => {
      const item = button.dataset.ingredient; selected.has(item) ? selected.delete(item) : selected.add(item);
      button.setAttribute('aria-pressed', String(selected.has(item))); render();
    }));
    workflow.addEventListener('workflow-reset', () => { box.querySelectorAll('[data-ingredient]').forEach(b => { selected.add(b.dataset.ingredient); b.setAttribute('aria-pressed', 'true'); }); render(); }); render();
  } else if (/Voice|RAG/i.test(name)) {
    const answers = [
      ['Expenses', 'How do I submit an expense?', 'Expense policy · sample passage 02', 'Submit your receipt and business purpose through the expense portal.'],
      ['Time off', 'How do I request time off?', 'Leave policy · sample passage 05', 'Send a request through the leave portal for your manager to review.']
    ];
    const box = controls(panels[1], '<p class="control-prompt">Ask the sample handbook a question.</p><div class="choice-actions">'+answers.map((a,i) => '<button type="button" data-question="'+i+'" aria-pressed="'+(i===0)+'">'+a[0]+'</button>').join('')+'</div><p class="choice-result" role="status">Expense question selected. Open Answer to follow the source.</p>');
    function render(i) {
      const a = answers[i]; setCopy(panels[1], a[1], 'Choose a question to change the retrieved passage and answer.');
      setCopy(panels[2], a[2], 'This preset passage is the source for your selected question.');
      setCopy(panels[3], a[3], 'Source: '+a[2]+'. This is a local retrieval example, not a live model response.');
      box.querySelectorAll('[data-question]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.question)===i)));
      box.querySelector('.choice-result').textContent = a[0]+' question selected. Open Answer to follow the source.';
    }
    box.querySelectorAll('[data-question]').forEach(b => b.addEventListener('click', () => render(Number(b.dataset.question)))); workflow.addEventListener('workflow-reset', () => render(0)); render(0);
  } else {
    workflow.classList.remove('playground');
    workflow.querySelector('.example-label').textContent = 'Illustrative workflow';
    panels.forEach(panel => { panel.querySelector('.panel-label').hidden = false; });
  }
}
