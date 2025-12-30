import { useEffect, useRef } from 'react'
import './FallingLogos.css'

export default function FallingLogos() {
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

    const gravity = 0.15
    const repelRadius = 120
    const friction = 0.98
    const bounce = 0.7

    // Text collision area (tight around the actual text only)
    const textArea = {
      x: canvas.width * 0.25,  // Start closer to center
      y: canvas.height * 0.45,
      width: canvas.width * 0.5,  // Much narrower to match actual text
      height: canvas.height * 0.1
    }

    class Logo {
      constructor(img, delay = 0) {
        this.x = Math.random() * (canvas.width - 40)
        this.y = -50 - delay * 100 // Stagger the initial positions
        this.vx = 0
        this.vy = Math.random() * 1 + 0.5
        this.size = 40
        this.img = img
        this.settled = false
        this.rotation = 0
        this.rotationSpeed = 0
      }

      update() {
        // Always apply gravity unless logo is resting at the bottom
        const isAtBottom = this.y >= canvas.height - this.size && Math.abs(this.vy) < 0.1
        
        if (!isAtBottom) {
          this.vy += gravity
          this.settled = false
        }

        // Mouse repulsion
        const dx = this.x - mouseRef.current.x
        const dy = this.y - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < repelRadius && dist > 0) {
          const force = (repelRadius - dist) / repelRadius
          this.vx += (dx / dist) * force * 3
          this.vy += (dy / dist) * force * 3
          
          // Add rotation when repelled by mouse
          this.rotationSpeed += (Math.random() - 0.5) * force * 0.3
          
          // If pushed, no longer settled
          if (force > 0.5) {
            this.settled = false
          }
        }

        // Apply velocity
        this.x += this.vx
        this.y += this.vy
        
        // Update rotation
        this.rotation += this.rotationSpeed
        
        // Apply friction to rotation
        this.rotationSpeed *= 0.98

        // Apply friction
        this.vx *= friction
        this.vy *= friction

        // Boundary collisions
        // Left and right walls
        if (this.x <= 0 || this.x >= canvas.width - this.size) {
          this.vx *= -bounce
          this.x = Math.max(0, Math.min(canvas.width - this.size, this.x))
        }

        // Top boundary - prevent logos from going off screen
        if (this.y <= 0) {
          this.y = 0
          this.vy *= -bounce
          this.vy = Math.max(this.vy, 0) // Ensure downward velocity after hitting top
        }

        // Text area collision
        this.checkTextCollision(textArea)

        // Bottom collision - settle here
        if (this.y >= canvas.height - this.size) {
          this.y = canvas.height - this.size
          this.vy *= -bounce
          
          // If velocity is very low, consider it settled
          if (Math.abs(this.vy) < 0.1 && Math.abs(this.vx) < 0.1) {
            this.settled = true
            this.vy = 0
          }
        }
      }

      // Check collision with another logo
      checkCollision(other) {
        const dx = this.x + this.size/2 - (other.x + other.size/2)
        const dy = this.y + this.size/2 - (other.y + other.size/2)
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDistance = (this.size + other.size) / 2

        if (distance < minDistance && distance > 0) {
          // Calculate collision response
          const overlap = minDistance - distance
          const separationX = (dx / distance) * overlap * 0.5
          const separationY = (dy / distance) * overlap * 0.5

          // Separate the logos
          this.x += separationX
          this.y += separationY
          other.x -= separationX
          other.y -= separationY

          // Calculate velocity exchange (elastic collision)
          const normalX = dx / distance
          const normalY = dy / distance

          // Relative velocity
          const relativeVelX = this.vx - other.vx
          const relativeVelY = this.vy - other.vy

          // Relative velocity in collision normal direction
          const speed = relativeVelX * normalX + relativeVelY * normalY

          // Only resolve if objects are moving towards each other
          if (speed < 0) return

          // Collision impulse
          const impulse = 2 * speed / 2 // Assuming equal mass
          
          // Update velocities
          this.vx -= impulse * normalX
          this.vy -= impulse * normalY
          other.vx += impulse * normalX
          other.vy += impulse * normalY

          // Add some damping to make collisions less bouncy
          this.vx *= 0.8
          this.vy *= 0.8
          other.vx *= 0.8
          other.vy *= 0.8

          // Add rotation from collision
          this.rotationSpeed += (Math.random() - 0.5) * 0.2
          other.rotationSpeed += (Math.random() - 0.5) * 0.2

          // Mark as unsettled if collision was significant
          if (Math.abs(impulse) > 0.5) {
            this.settled = false
            other.settled = false
          }
        }
      }

      // Check collision with text area
      checkTextCollision(textArea) {
        const logoLeft = this.x
        const logoRight = this.x + this.size
        const logoTop = this.y
        const logoBottom = this.y + this.size

        const textLeft = textArea.x
        const textRight = textArea.x + textArea.width
        const textTop = textArea.y
        const textBottom = textArea.y + textArea.height

        // Check if logo overlaps with text area
        if (logoRight > textLeft && logoLeft < textRight && 
            logoBottom > textTop && logoTop < textBottom) {
          
          // Calculate overlap amounts
          const overlapLeft = logoRight - textLeft
          const overlapRight = textRight - logoLeft
          const overlapTop = logoBottom - textTop
          const overlapBottom = textBottom - logoTop

          // Find minimum overlap direction for precise collision
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

          // Position logo exactly at the boundary (no gaps)
          if (minOverlap === overlapLeft) {
            // Hit left side of text
            this.x = textLeft - this.size
            this.vx = -Math.abs(this.vx) * bounce
          } else if (minOverlap === overlapRight) {
            // Hit right side of text
            this.x = textRight
            this.vx = Math.abs(this.vx) * bounce
          } else if (minOverlap === overlapTop) {
            // Hit top of text
            this.y = textTop - this.size
            this.vy = -Math.abs(this.vy) * bounce
          } else if (minOverlap === overlapBottom) {
            // Hit bottom of text
            this.y = textBottom
            this.vy = Math.abs(this.vy) * bounce
          }

          // Add rotation from text collision
          this.rotationSpeed += (Math.random() - 0.5) * 0.2
          this.settled = false
        }
      }

      draw() {
        ctx.save()
        
        // Translate to logo center for rotation
        ctx.translate(this.x + this.size/2, this.y + this.size/2)
        ctx.rotate(this.rotation)
        
        // Draw image centered at origin
        ctx.drawImage(this.img, -this.size/2, -this.size/2, this.size, this.size)
        
        ctx.restore()
      }
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    const handleResize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    // Create logos using actual image files
    const createLogos = () => {
      const logoSources = [
        '/logos/netflix.png',
        '/logos/spotify.png', 
        '/logos/gcp.png',
        '/logos/m365.png'
      ]
      
      let loadedCount = 0
      const totalLogos = logoSources.length * 2 // 2 of each logo
      
      logoSources.forEach((src, index) => {
        const img = new Image()
        img.onload = () => {
          // Create 2 instances of each logo
          for (let i = 0; i < 2; i++) {
            logosRef.current.push(new Logo(img, index * 2 + i))
          }
          loadedCount++
          
          // Start animation when all images are loaded
          if (loadedCount === logoSources.length && !animationRef.current) {
            animate()
          }
        }
        img.onerror = () => {
          console.error(`Failed to load logo: ${src}`)
          loadedCount++
          
          // Still start animation even if some images fail
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
      
      // Check collisions between all pairs of logos
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
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="logo-canvas" />
}