import { useEffect, useRef } from 'react'
import './FallingLogos.css'

export default function MobileFallingLogos() {
  const canvasRef = useRef(null)
  const animationRef = useRef()
  const logosRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const gravity = 0.12
    const repelRadius = 100
    const friction = 0.98
    const bounce = 0.6

    class Logo {
      constructor(img, delay = 0) {
        this.x = Math.random() * (canvas.width - 30)
        this.y = -50 - delay * 80
        this.vx = 0
        this.vy = Math.random() * 1 + 0.3
        this.size = 30 // Smaller for mobile
        this.img = img
        this.settled = false
        this.rotation = 0
        this.rotationSpeed = 0
        this.opacity = 0.7 // Slightly transparent for better form visibility
      }

      update() {
        // Always apply gravity unless logo is resting at the bottom
        const isAtBottom = this.y >= canvas.height - this.size && Math.abs(this.vy) < 0.1
        
        if (!isAtBottom) {
          this.vy += gravity
          this.settled = false
        }

        // Mouse/touch repulsion only
        const dx = this.x + this.size/2 - mouseRef.current.x
        const dy = this.y + this.size/2 - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < repelRadius && dist > 0) {
          const force = (repelRadius - dist) / repelRadius
          this.vx += (dx / dist) * force * 2.5
          this.vy += (dy / dist) * force * 2.5
          
          this.rotationSpeed += (Math.random() - 0.5) * force * 0.2
          
          if (force > 0.3) {
            this.settled = false
          }
        }

        // Apply velocity
        this.x += this.vx
        this.y += this.vy
        
        // Update rotation
        this.rotation += this.rotationSpeed
        this.rotationSpeed *= 0.95

        // Apply friction
        this.vx *= friction
        this.vy *= friction

        // Boundary collisions
        if (this.x <= 0 || this.x >= canvas.width - this.size) {
          this.vx *= -bounce
          this.x = Math.max(0, Math.min(canvas.width - this.size, this.x))
        }

        if (this.y <= 0) {
          this.y = 0
          this.vy *= -bounce
          this.vy = Math.max(this.vy, 0)
        }

        // Bottom collision
        if (this.y >= canvas.height - this.size) {
          this.y = canvas.height - this.size
          this.vy *= -bounce
          
          if (Math.abs(this.vy) < 0.1 && Math.abs(this.vx) < 0.1) {
            this.settled = true
            this.vy = 0
          }
        }
      }

      checkCollision(other) {
        const dx = this.x + this.size/2 - (other.x + other.size/2)
        const dy = this.y + this.size/2 - (other.y + other.size/2)
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDistance = (this.size + other.size) / 2

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance
          const separationX = (dx / distance) * overlap * 0.5
          const separationY = (dy / distance) * overlap * 0.5

          this.x += separationX
          this.y += separationY
          other.x -= separationX
          other.y -= separationY

          const normalX = dx / distance
          const normalY = dy / distance

          const relativeVelX = this.vx - other.vx
          const relativeVelY = this.vy - other.vy

          const speed = relativeVelX * normalX + relativeVelY * normalY

          if (speed < 0) return

          const impulse = 2 * speed / 2
          
          this.vx -= impulse * normalX * 0.7
          this.vy -= impulse * normalY * 0.7
          other.vx += impulse * normalX * 0.7
          other.vy += impulse * normalY * 0.7

          this.rotationSpeed += (Math.random() - 0.5) * 0.15
          other.rotationSpeed += (Math.random() - 0.5) * 0.15

          if (Math.abs(impulse) > 0.3) {
            this.settled = false
            other.settled = false
          }
        }
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        
        ctx.translate(this.x + this.size/2, this.y + this.size/2)
        ctx.rotate(this.rotation)
        
        ctx.drawImage(this.img, -this.size/2, -this.size/2, this.size, this.size)
        
        ctx.restore()
      }
    }

    const handleClick = (e) => {
      console.log('Canvas clicked!', e)
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      
      // Create explosion effect on click
      logosRef.current.forEach(logo => {
        const dx = (logo.x + logo.size/2) - clickX
        const dy = (logo.y + logo.size/2) - clickY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 200) {
          const force = (200 - dist) / 200
          const pushStrength = 12
          
          logo.vx += (dx / (dist || 1)) * force * pushStrength
          logo.vy += (dy / (dist || 1)) * force * pushStrength
          logo.rotationSpeed += (Math.random() - 0.5) * force * 1.0
          logo.settled = false
        }
      })
    }

    const handleTouchStart = (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      const touchX = touch.clientX - rect.left
      const touchY = touch.clientY - rect.top
      
      console.log('Touch detected at:', touchX, touchY) // Debug log
      
      // Create a strong repulsion effect from touch point
      let logosAffected = 0
      logosRef.current.forEach(logo => {
        const dx = (logo.x + logo.size/2) - touchX
        const dy = (logo.y + logo.size/2) - touchY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 150) { // Larger radius for touch
          const force = (150 - dist) / 150
          const pushStrength = 10 // Even stronger push force
          
          logo.vx += (dx / (dist || 1)) * force * pushStrength
          logo.vy += (dy / (dist || 1)) * force * pushStrength
          logo.rotationSpeed += (Math.random() - 0.5) * force * 0.8
          logo.settled = false
          logosAffected++
        }
      })
      
      console.log('Logos affected:', logosAffected) // Debug log
      
      // Update mouse position for continuous effect
      mouseRef.current = { x: touchX, y: touchY }
    }

    const handleTouchMove = (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    }

    const handleTouchEnd = (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Reset mouse position when touch ends
      mouseRef.current = { x: -1000, y: -1000 }
    }

    const handleResize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    // Create logos
    const createLogos = () => {
      const logoSources = [
        '/logos/netflix.png',
        '/logos/spotify.png', 
        '/logos/gcp.png',
        '/logos/m365.png'
      ]
      
      let loadedCount = 0
      
      logoSources.forEach((src, index) => {
        const img = new Image()
        img.onload = () => {
          // Create 1 instance of each logo for mobile (less crowded)
          logosRef.current.push(new Logo(img, index))
          loadedCount++
          
          if (loadedCount === logoSources.length && !animationRef.current) {
            animate()
          }
        }
        img.onerror = () => {
          console.error(`Failed to load logo: ${src}`)
          loadedCount++
          
          if (loadedCount === logoSources.length && !animationRef.current) {
            animate()
          }
        }
        img.src = src
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Update all logos
      logosRef.current.forEach(logo => {
        logo.update()
      })
      
      // Check collisions between logos
      for (let i = 0; i < logosRef.current.length; i++) {
        for (let j = i + 1; j < logosRef.current.length; j++) {
          logosRef.current[i].checkCollision(logosRef.current[j])
        }
      }
      
      // Draw all logos
      logosRef.current.forEach(logo => {
        logo.draw()
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }

    // Initialize
    createLogos()
    
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    // Event listeners
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    window.addEventListener('resize', handleResize)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="logo-canvas mobile-logo-canvas" />
}