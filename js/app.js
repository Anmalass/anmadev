const $ = (s) => document.querySelector(s);
const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

let data;
let tracks = [];
let index = 0;
const audio = $('#audio');

async function load() {
  try {
    const res = await fetch('content/content.json');
    if (!res.ok) throw new Error('content.json not found');
    data = await res.json();
    render();
  } catch (e) {
    console.error(e);
    $('#heroBio').textContent = 'Gagal memuat content.json. Jalankan melalui GitHub Pages atau local server.';
  }
}

function render() {
  const p = data.profile;
  document.title = `${p.name} — Portfolio`;
  $('#greeting').textContent = p.greeting;
  $('#heroName').textContent = p.name;
  $('#heroRole').textContent = p.role;
  $('#heroBio').textContent = p.bio;
  $('#location').textContent = `● ${p.location}`;
  if (p.avatar) $('#avatar').src = p.avatar;
  $('#aboutTitle').textContent = data.about.title;
  $('#aboutText').textContent = data.about.text;
  $('#businessTitle').textContent = data.business.title;
  $('#businessText').textContent = data.business.text;
  $('#animeTitle').textContent = data.anime.title;
  $('#animeDescription').textContent = data.anime.description;
  $('#footerText').textContent = data.footer;
  $('#year').textContent = new Date().getFullYear();

  $('#skills').innerHTML = (data.skills || []).map((s,i) => `<div class="skill"><span>0${i+1}</span><h3>${esc(s.name)}</h3><small>${esc(s.level)}</small></div>`).join('');
  $('#projects').innerHTML = (data.projects || []).map((p,i) => `<article class="project"><div class="project-no">0${i+1}</div><div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="tags">${(p.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div></div><span class="arrow">↗</span></article>`).join('');
  $('#activities').innerHTML = (data.activities || []).map(a => `<article class="activity"><div class="activity-img"><img src="${esc(a.image)}" alt="${esc(a.title)}" onerror="this.style.display='none'"><span>${esc(a.title)}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p></article>`).join('');
  $('#hobbies').innerHTML = (data.hobbies || []).map(h=>`<span>${esc(h)}</span>`).join('');
  $('#socials').innerHTML = (data.socials || []).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join('');

  tracks = data.music || [];
  if (tracks.length) {
    $('#playlist').innerHTML = tracks.map((t,i)=>`<button class="track" data-index="${i}"><span class="track-num">${String(i+1).padStart(2,'0')}</span><img src="${esc(t.cover || 'assets/music-cover.svg')}" alt=""><span class="track-main"><b>${esc(t.title)}</b><small>${esc(t.artist || '')}</small></span><span class="track-play">▶</span></button>`).join('');
    document.querySelectorAll('.track').forEach(b=>b.addEventListener('click',()=>playTrack(Number(b.dataset.index))));
    loadTrack(0);
  }

  if (data.anime.video) {
    const u = data.anime.video;
    if (/youtube\.com|youtu\.be/.test(u)) {
      let id = u.includes('youtu.be/') ? u.split('youtu.be/')[1].split(/[?&]/)[0] : new URL(u).searchParams.get('v');
      if (id) {
        $('#animeVideo').innerHTML = `<iframe class="motion-frame" src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&loop=1&playlist=${encodeURIComponent(id)}&controls=0&disablekb=1&fs=0&playsinline=1&rel=0&modestbranding=1" title="Anime motion" allow="autoplay; encrypted-media" tabindex="-1"></iframe>`;
      }
    } else {
      $('#animeVideo').innerHTML = `<video class="motion-video" autoplay muted loop playsinline preload="auto" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback noplaybackrate" tabindex="-1" src="${esc(u)}"></video>`;
      const motion = $('#animeVideo video');
      if (motion) {
        motion.addEventListener('contextmenu', e => e.preventDefault());
        motion.controls = false;
        motion.setAttribute('aria-hidden','true');
        motion.addEventListener('pause', () => motion.play().catch(() => {}));
        motion.addEventListener('canplay', () => motion.play().catch(() => {}));
        motion.addEventListener('stalled', () => motion.play().catch(() => {}));
        motion.addEventListener('waiting', () => motion.play().catch(() => {}));
        motion.addEventListener('error', () => {
          motion.classList.add('motion-fallback');
        });
      }
    }
  }
  setTimeout(()=>document.querySelectorAll('.reveal').forEach(x=>x.classList.add('show')),80);
}

function loadTrack(i){ if(!tracks.length)return; index=(i+tracks.length)%tracks.length; const t=tracks[index]; audio.src=t.file; $('#songTitle').textContent=t.title; $('#songArtist').textContent=t.artist||''; $('#albumCover').src=t.cover||'assets/music-cover.svg'; $('#progress').value=0; $('#currentTime').textContent='0:00'; document.querySelectorAll('.track').forEach((x,n)=>x.classList.toggle('active',n===index)); }
function playTrack(i=index){ if(i!==index || !audio.src) loadTrack(i); audio.play().then(()=>$('#play').textContent='❚❚').catch(()=>{}); }
function fmt(sec){if(!isFinite(sec))return'0:00';return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`}
$('#play').addEventListener('click',()=>{if(!tracks.length)return;if(audio.paused)playTrack(index);else{audio.pause();$('#play').textContent='▶'}});
$('#prev').addEventListener('click',()=>{loadTrack(index-1);playTrack(index)});
$('#next').addEventListener('click',()=>{loadTrack(index+1);playTrack(index)});
audio.addEventListener('loadedmetadata',()=>$('#duration').textContent=fmt(audio.duration));
audio.addEventListener('timeupdate',()=>{if(audio.duration){$('#progress').value=audio.currentTime/audio.duration*100;$('#currentTime').textContent=fmt(audio.currentTime)}});
audio.addEventListener('ended',()=>{loadTrack(index+1);playTrack(index)});
$('#progress').addEventListener('input',e=>{if(audio.duration)audio.currentTime=(e.target.value/100)*audio.duration});

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.12});
document.querySelectorAll('.section,.contact').forEach(x=>observer.observe(x));
window.addEventListener('scroll',()=>$('#nav').classList.toggle('scrolled',scrollY>20));
load();
