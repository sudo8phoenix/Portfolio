'use strict';
// An original, locally synthesized ambient loop; playback starts only after the visitor opts in.
const soundDock = document.createElement('aside');
soundDock.className = 'sound-dock'; soundDock.setAttribute('aria-label','Background music');
soundDock.innerHTML = '<div class="sound-volume-panel"><output for="music-volume">40%</output><label class="sr-only" for="music-volume">Background music volume</label><input id="music-volume" type="range" min="0" max="100" step="1" value="40" aria-valuetext="40 percent"></div><button type="button" class="sound-toggle" aria-pressed="false" aria-label="Turn on background lo-fi music" title="Turn on background lo-fi music">'+window.portfolioIcon('volume')+'</button><span class="sr-only sound-status" role="status"></span>';
document.body.append(soundDock);
const soundToggle = soundDock.querySelector('button'), soundStatus = soundDock.querySelector('.sound-status');
const volumeSlider = soundDock.querySelector('input'), volumeOutput = soundDock.querySelector('output');
let audio, master, bus, noise, enabled = false, timer = 0, nextBeat = 0, beat = 0, starting = null;
let volumeLevel = 40, musicStartedAt = 0;
const musicSessionKey = 'portfolio-music-opt-in-session';
try {
  const saved = JSON.parse(sessionStorage.getItem(musicSessionKey) || 'null');
  if (saved && typeof saved.enabled === 'boolean') {
    enabled = saved.enabled;
    if (Number.isFinite(saved.volumeLevel)) volumeLevel = Math.max(0, Math.min(100, saved.volumeLevel));
    if (Number.isFinite(saved.startedAt) && saved.startedAt > 0 && saved.startedAt <= Date.now()) musicStartedAt = saved.startedAt;
  }
} catch { /* Playback still works when session storage is unavailable. */ }
function saveMusicSession() {
  try { sessionStorage.setItem(musicSessionKey, JSON.stringify({enabled, volumeLevel, startedAt:musicStartedAt})); } catch { /* Optional persistence. */ }
}

const eighth = 60 / 74 / 2;
const chords = [[48,55,58,62,67],[45,52,55,59,64],[50,57,60,64,69],[43,50,53,57,62]];
const hz = midi => 440 * Math.pow(2,(midi-69)/12);
function volume() { return .16 * volumeLevel / 100; }
function synth(frequency,start,duration,gain,type='sine') {
  const osc=audio.createOscillator(), envelope=audio.createGain();osc.type=type;osc.frequency.value=frequency;
  envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(gain,start+.025);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(envelope);envelope.connect(bus);osc.start(start);osc.stop(start+duration+.03);
  osc.onended=()=>{osc.disconnect();envelope.disconnect();};
}
function percussion(start,gain,highpass,duration) {
  const source=audio.createBufferSource(), filter=audio.createBiquadFilter(), envelope=audio.createGain();source.buffer=noise;filter.type='highpass';filter.frequency.value=highpass;
  envelope.gain.setValueAtTime(gain,start);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
  source.connect(filter);filter.connect(envelope);envelope.connect(bus);source.start(start);source.stop(start+duration);
  source.onended=()=>{source.disconnect();filter.disconnect();envelope.disconnect();};
}
function schedule() {
  if (audio.state !== 'running') return;
  // Skip expired notes after a throttled timer; never replay a backlog.
  if (nextBeat < audio.currentTime - .05) {
    const skipped = Math.ceil((audio.currentTime - nextBeat) / eighth);
    beat += skipped; nextBeat += skipped * eighth;
  }
  while(nextBeat<audio.currentTime+(document.hidden ? 2 : .25)) {
    const local=beat%8, chord=chords[Math.floor(beat/16)%chords.length];
    if(beat%16===0) chord.forEach((note,i)=>synth(hz(note),nextBeat+i*.012,eighth*15,.13,'triangle'));
    if(local===0||local===4) {
      const kick=audio.createOscillator(), envelope=audio.createGain();kick.frequency.setValueAtTime(115,nextBeat);kick.frequency.exponentialRampToValueAtTime(43,nextBeat+.13);
      envelope.gain.setValueAtTime(.4,nextBeat);envelope.gain.exponentialRampToValueAtTime(.0001,nextBeat+.22);kick.connect(envelope);envelope.connect(bus);kick.start(nextBeat);kick.stop(nextBeat+.24);kick.onended=()=>{kick.disconnect();envelope.disconnect();};
      synth(hz(chord[0]-12),nextBeat,eighth*3,.23);
    }
    if(local===2||local===6)percussion(nextBeat,.075,1100,.12);
    if(local%2===1)percussion(nextBeat,.025,6000,.045);
    if(local===3||local===7)synth(hz(chord[local===3?3:4]+12),nextBeat,eighth*1.5,.055);
    nextBeat+=eighth;beat++;
  }
}
function createAudio() {
  const AudioEngine=window.AudioContext||window.webkitAudioContext;
  if(!AudioEngine)throw new Error('Audio unavailable');
  audio=new AudioEngine();master=audio.createGain();master.gain.value=0;
  bus=audio.createBiquadFilter();bus.type='lowpass';bus.frequency.value=3400;bus.Q.value=.5;
  const compressor=audio.createDynamicsCompressor();compressor.threshold.value=-20;compressor.ratio.value=3;
  bus.connect(compressor);compressor.connect(master);master.connect(audio.destination);
  noise=audio.createBuffer(1,audio.sampleRate*.25,audio.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
}
function renderSound() {
  soundToggle.setAttribute('aria-pressed',String(enabled));soundToggle.setAttribute('aria-label',enabled?'Mute background lo-fi music':'Turn on background lo-fi music');
  soundToggle.innerHTML=window.portfolioIcon(enabled && volumeLevel > 0?'volume':'volume-off');
  soundToggle.title=enabled?'Mute background lo-fi music':'Turn on background lo-fi music';
  soundDock.classList.toggle('is-playing',enabled);
}
function alignMusicClock() {
  if (!musicStartedAt) { musicStartedAt = Date.now(); saveMusicSession(); }
  const elapsed = Math.max(0, (Date.now() - musicStartedAt) / 1000);
  beat = Math.ceil(elapsed / eighth);
  nextBeat = audio.currentTime + Math.max(.025, beat * eighth - elapsed);
  // Restore the sustained harmony when entering a page between chord changes.
  const chordIndex = Math.floor(elapsed / (eighth * 16));
  const remaining = eighth * 16 - elapsed % (eighth * 16);
  if (beat % 16 !== 0) chords[chordIndex % chords.length].forEach((note,i) => synth(hz(note),audio.currentTime+.025+i*.012,Math.max(.1,remaining),.13,'triangle'));
}
async function playSound() {
  if (starting) return starting;
  starting = (async () => {
    try {
      if(!audio) createAudio();
      if(audio.state !== 'running') await audio.resume();
      if(!enabled || audio.state !== 'running') return;
      master.gain.cancelScheduledValues(audio.currentTime);
      master.gain.setTargetAtTime(volume(),audio.currentTime,.08);
      // Existing playback is never rescheduled by navigation or unmuting.
      if (!timer) { alignMusicClock(); timer=setInterval(schedule,100); schedule(); }
      soundStatus.textContent='Background music on.';
    } catch {
      soundStatus.textContent='Music is ready. Interact with the page to start playback.';
    }
  })();
  try { await starting; } finally { starting = null; }
}
function muteSound() {
  // Mute the output while the musical clock keeps moving.
  if(audio) { master.gain.cancelScheduledValues(audio.currentTime);master.gain.setTargetAtTime(0,audio.currentTime,.04); }
}
soundToggle.addEventListener('click',()=>{
  enabled=!enabled; renderSound();
  if(enabled) { if(volumeLevel === 0) { volumeLevel=40; syncVolume(); } playSound(); }
  else { muteSound();soundStatus.textContent='Background music muted.'; }
  saveMusicSession();
});
function syncVolume() {
  volumeSlider.value=String(volumeLevel); volumeOutput.value=`${volumeLevel}%`;
  volumeSlider.setAttribute('aria-valuetext', `${volumeLevel} percent`);
  if(master && audio.state === 'running') master.gain.setTargetAtTime(enabled ? volume() : 0,audio.currentTime,.05);
  renderSound(); saveMusicSession();
}
volumeSlider.addEventListener('input',()=>{
  volumeLevel=Number(volumeSlider.value); enabled=volumeLevel>0; syncVolume();
  if(enabled && audio?.state !== 'running') playSound();
  else if(!enabled) muteSound();
});
soundDock.addEventListener('keydown',event=>{
  if(event.key === 'Escape') { soundDock.classList.add('volume-dismissed');soundToggle.focus(); }
});
soundDock.addEventListener('pointerenter',()=>soundDock.classList.remove('volume-dismissed'));
soundDock.addEventListener('focusout',event=>{if(!soundDock.contains(event.relatedTarget))soundDock.classList.remove('volume-dismissed');});
// Muting the icon is handled before the first-gesture fallback sees that click.
function unlockMusic(event) {
  if(event.type==='keydown' && !['Enter',' '].includes(event.key)) return;
  if(event.target.closest('.sound-dock') || !enabled || document.hidden) return;
  if(audio?.state !== 'running') playSound();
}
document.addEventListener('click',unlockMusic);
document.addEventListener('keydown',unlockMusic);
document.addEventListener('visibilitychange',()=>{
  if (document.hidden) { if(timer) schedule(); }
  else if(enabled && audio?.state !== 'running') playSound();
});
window.addEventListener('pagehide',()=>{
  saveMusicSession();clearInterval(timer);timer=0;
  if(audio) audio.suspend().catch(()=>{});
});
window.addEventListener('pageshow',event=>{if(event.persisted && enabled)playSound();});
syncVolume();
// Resume only an explicit opt-in saved during this browser session.
try { if(enabled) { createAudio(); if(audio.state === 'running') playSound(); } } catch { /* The icon can retry. */ }
