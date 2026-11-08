'use strict';

// Each visual is a small, deterministic illustration of the project's job.
// No requests, predictions, integrations, or model calls are made here.
const projectLabs = {
  'review-tag-generator': {
    name: 'Review Tag Generator', kind: 'sentiment', label: 'Inspect a review',
    options: ['Battery', 'Display', 'Delivery'],
    render(index) {
      const samples = [
        ['The battery lasts all day, but charging is slow.', 'battery lasts all day', 'Positive · battery life', 'charging is slow', 'Negative · charging speed'],
        ['The screen is sharp, but too dim outdoors.', 'screen is sharp', 'Positive · display clarity', 'too dim outdoors', 'Negative · brightness'],
        ['Delivery was quick, but the box was damaged.', 'Delivery was quick', 'Positive · delivery speed', 'box was damaged', 'Negative · packaging']
      ];
      const [review, good, goodTag, bad, badTag] = samples[index];
      return {visual:`<div class="sentiment-review">“${review.replace(good, `<mark>${good}</mark>`).replace(bad, `<mark class="negative-mark">${bad}</mark>`)}”</div><div class="sentiment-tags"><span>+ ${goodTag}</span><span>− ${badTag}</span></div>`, summary:`Two features extracted: ${goodTag.toLowerCase()}; ${badTag.toLowerCase()}.`};
    }
  },
  'product-analytics-warehouse': {
    name:'Product Analytics Warehouse', kind:'funnel', label:'Compare a sample funnel', options:['Desktop', 'Mobile'],
    render(index) {
      const values = index ? [1000,380,150,60] : [1000,540,270,120];
      return {visual:`<div class="funnel-bars">${['View','Cart','Checkout','Purchase'].map((label,i)=>`<div><span>${label}</span><div class="funnel-track"><i style="--amount:${values[i]/10}%"></i></div><strong>${values[i].toLocaleString()}</strong></div>`).join('')}</div>`, summary:`Sample ${index ? 'mobile' : 'desktop'} conversion: ${values[3]/10}%. ${values[3]} purchases from 1,000 views.`};
    }
  },
  astra: {
    name:'Astra', kind:'agent', label:'Give the assistant a task', options:['Plan my day', 'Draft a reply', 'Find a slot'],
    render(index) {
      const plans = [
        ['Plan my day', ['Read sample tasks', 'Order by priority', 'Prepare a day plan'], 'A focused plan, ready for your review.'],
        ['Draft a reply', ['Read sample thread', 'Collect key points', 'Prepare a reply draft'], 'A draft is prepared. Nothing is sent.'],
        ['Find a slot', ['Read sample calendar', 'Compare availability', 'Suggest 14:00–14:30'], 'A sample time is suggested. Nothing is booked.']
      ];
      const [request, steps, result] = plans[index];
      return {visual:`<div class="agent-request">${request}<span aria-hidden="true">↗</span></div><ol class="agent-plan">${steps.map(step=>`<li><span aria-hidden="true">✓</span>${step}</li>`).join('')}</ol>`, summary:result};
    }
  },
  'recsys-engine': {
    name:'Scalable RecSys Engine', kind:'recommendation', label:'Explore sample similarity', options:['Space', 'Mystery', 'Animation'],
    render(index) {
      const choices = [
        [['Interstellar','Space · exploration'],['The Martian','Space · survival'],['Arrival','Science fiction · contact']],
        [['Knives Out','Mystery · ensemble'],['The Prestige','Mystery · rivalry'],['Shutter Island','Mystery · suspense']],
        [['WALL·E','Animation · science fiction'],['Spirited Away','Animation · fantasy'],['The Iron Giant','Animation · friendship']]
      ];
      return {visual:`<div class="recommendation-shelf">${choices[index].map(([title,genre],i)=>`<div><span class="movie-spine spine-${(index+i)%3}" aria-hidden="true">${['◌','◇','↗'][i]}</span><strong>${title}</strong><span>${genre}</span></div>`).join('')}</div>`, summary:`Sample matches for ${this.options[index].toLowerCase()}: ${choices[index].map(movie=>movie[0]).join(', ')}.`};
    }
  },
  'sentient-ambient-ai': {
    name:'Sentient Ambient AI', kind:'ambient', label:'Change a sample signal', options:['Neutral', 'Happy', 'Surprised'],
    render(index) {
      return {visual:`<div class="ambient-room ambient-${index}"><div class="ambient-light" aria-hidden="true"></div><span class="ambient-face" aria-hidden="true">${['− ‿ −','◡ ◡','◉ ◉'][index]}</span><span class="ambient-signal">${this.options[index]} sample → smoothed signal → light</span></div>`, summary:`${this.options[index]} sample selected. The lighting preview shifts to ${['a soft neutral','a warm amber','a cool blue'][index]} tone.`};
    }
  },
  'stock-prediction': {
    name:'Stock Prediction Model', kind:'forecast', label:'Compare illustrative model curves', options:['Baseline', 'Tuned model'],
    render(index) {
      const actual = '0,95 25,85 50,96 75,61 100,70 125,40 150,53 175,20 200,29 225,12';
      const prediction = index ? '0,100 25,91 50,89 75,69 100,65 125,48 150,44 175,29 200,24 225,18' : '0,105 25,101 50,98 75,93 100,86 125,80 150,73 175,66 200,59 225,52';
      return {visual:`<div class="forecast-legend"><span>— Sample history</span><span>┄ ${this.options[index]}</span></div><svg class="forecast-chart" viewBox="-5 -5 240 130" role="img" aria-label="Illustrative history and ${this.options[index].toLowerCase()} curve"><path d="M0 30H225M0 65H225M0 100H225" class="chart-grid"/><polyline points="${actual}" class="chart-actual"/><polyline points="${prediction}" class="chart-model"/></svg><div class="forecast-axis"><span>Earlier</span><span>Later</span></div>`, summary:`${this.options[index]} selected. Illustrative curves only; these are not measured project results or market forecasts.`};
    }
  }
};

function createProjectLab(key) {
  const config = projectLabs[key];
  const lab = document.createElement('section');
  lab.className = `project-lab lab-${config.kind}`;
  lab.setAttribute('aria-label', `${config.name} interactive sample`);
  lab.innerHTML = `<div class="lab-heading"><span>${config.label}</span><span aria-hidden="true">↗</span></div><div class="lab-choices" aria-label="${config.label}">${config.options.map((option,index)=>`<button type="button" data-lab-option="${index}" aria-pressed="${index===0}">${option}</button>`).join('')}</div><div class="lab-visual"></div><p class="lab-result" role="status"></p><p class="lab-note">Interactive sample · illustrative data</p>`;
  function render(index) {
    const {visual,summary} = config.render(index);
    lab.querySelector('.lab-visual').innerHTML = visual;
    lab.querySelector('.lab-result').textContent = summary;
    lab.querySelectorAll('[data-lab-option]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.labOption)===index)));
  }
  lab.querySelectorAll('[data-lab-option]').forEach(button=>button.addEventListener('click',()=>render(Number(button.dataset.labOption))));
  render(0); return lab;
}

document.querySelectorAll('.library-row').forEach(row => {
  const href = row.querySelector('h3 a')?.getAttribute('href');
  const key = href?.split('/').pop().replace('.html','');
  if (!projectLabs[key]) return;
  row.classList.add('has-project-lab'); row.append(createProjectLab(key));
});
const caseKey = location.pathname.split('/').pop().replace('.html','');
if (document.body.classList.contains('case-page') && projectLabs[caseKey]) {
  const workflow = document.querySelector('[data-workflow]');
  if (workflow) workflow.before(createProjectLab(caseKey));
}
