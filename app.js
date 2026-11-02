const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Menú móvil
const nav = document.querySelector('.nav')
const toggle = document.querySelector('.nav-toggle')

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open')
  toggle.setAttribute('aria-expanded', open)
})

nav.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open')
    toggle.setAttribute('aria-expanded', false)
  })
})

// Aparición de elementos al entrar en pantalla
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' })

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el))

// Elementos con progreso de scroll (--p de 0 a 1)
const scrollers = [...document.querySelectorAll('[data-scroll]')]
const progressBar = document.querySelector('.progress')

const ringSection = document.querySelector('.ring-section')
const ringItems = [...document.querySelectorAll('.ring-item')]
const ringIndex = document.getElementById('ringIndex')
const ringStep = 360 / ringItems.length

const works = document.querySelector('.works')
const worksTrack = works.querySelector('.works-track')
const workCards = [...worksTrack.querySelectorAll('.work')]
let worksDist = 0

// La sección de trabajos mide lo necesario para recorrer el track horizontal
function sizeWorks() {
  const last = workCards[workCards.length - 1]
  const gutter = parseFloat(getComputedStyle(worksTrack).paddingLeft)
  worksDist = Math.max(0, last.offsetLeft + last.offsetWidth + gutter - innerWidth)
  works.style.setProperty('--dist', worksDist + 'px')
  works.style.height = innerHeight + worksDist + 'px'
}

let ticking = false

function update() {
  ticking = false
  const vh = innerHeight

  scrollers.forEach(el => {
    const rect = el.getBoundingClientRect()
    const p = el.dataset.scroll === 'enter'
      ? (vh - rect.top) / (vh * 0.85)
      : -rect.top / Math.max(1, rect.height - vh)
    el.progress = clamp(p, 0, 1)
    el.style.setProperty('--p', el.progress.toFixed(4))
  })

  // Anillo: oscurece las fotos que quedan de espaldas
  const rp = ringSection.progress
  ringItems.forEach((item, i) => {
    const angle = (i * ringStep - rp * ringStep * (ringItems.length - 1)) * Math.PI / 180
    item.style.setProperty('--face', ((Math.cos(angle) + 1) / 2).toFixed(3))
  })
  ringIndex.textContent = String(Math.round(rp * (ringItems.length - 1)) + 1).padStart(2, '0')

  // Trabajos: cada tarjeta gira según su distancia al centro
  const center = innerWidth / 2
  const trackX = -works.progress * worksDist
  workCards.forEach(card => {
    const x = card.offsetLeft + card.offsetWidth / 2 + trackX
    const off = clamp((x - center) / center, -1, 1)
    card.style.setProperty('--off', off.toFixed(3))
    card.style.setProperty('--aoff', Math.abs(off).toFixed(3))
  })

  const max = document.documentElement.scrollHeight - vh
  progressBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
  nav.classList.toggle('scrolled', scrollY > 30)
}

function requestUpdate() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(update)
  }
}

addEventListener('scroll', requestUpdate, { passive: true })
addEventListener('resize', () => {
  sizeWorks()
  requestUpdate()
})
addEventListener('load', () => {
  sizeWorks()
  requestUpdate()
})

sizeWorks()
update()

// Hero: la placa sigue al mouse con suavizado
const hero = document.querySelector('.hero')
let mx = 0, my = 0, targetX = 0, targetY = 0, mouseFrame = null

function followMouse() {
  mx += (targetX - mx) * 0.08
  my += (targetY - my) * 0.08
  hero.style.setProperty('--mx', mx.toFixed(3))
  hero.style.setProperty('--my', my.toFixed(3))
  const settled = Math.abs(targetX - mx) + Math.abs(targetY - my) < 0.001
  mouseFrame = settled ? null : requestAnimationFrame(followMouse)
}

function setMouseTarget(x, y) {
  targetX = x
  targetY = y
  if (!mouseFrame) mouseFrame = requestAnimationFrame(followMouse)
}

// Tarjetas que se inclinan bajo el cursor
if (finePointer && !reduceMotion) {
  hero.addEventListener('pointermove', e => {
    setMouseTarget(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1)
  })
  hero.addEventListener('pointerleave', () => setMouseTarget(0, 0))

  document.querySelectorAll('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      el.classList.add('tilting')
      el.style.setProperty('--rx', ((0.5 - y) * 12).toFixed(2) + 'deg')
      el.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg')
      el.style.setProperty('--gx', (x * 100).toFixed(1) + '%')
      el.style.setProperty('--gy', (y * 100).toFixed(1) + '%')
    })
    el.addEventListener('pointerleave', () => {
      el.classList.remove('tilting')
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    })
  })
}
