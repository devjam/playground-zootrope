import { button, buttonGroup, Leva, useControls } from 'leva'
import React, { useRef, useEffect } from 'react'
import { isMobile } from 'react-device-detect'

type Point = { x: number; y: number }

const Zoetrope: React.FC = () => {
  const [{ speed, color, opacity, width, erase }, set] = useControls(() => ({
    'speed preset': buttonGroup({
      '3': () => set({ speed: (Math.PI * 2) / 3 }),
      '6': () => set({ speed: (Math.PI * 2) / 6 }),
      '12': () => set({ speed: (Math.PI * 2) / 12 }),
      '24': () => set({ speed: (Math.PI * 2) / 24 }),
      '48': () => set({ speed: (Math.PI * 2) / 48 }),
      '96': () => set({ speed: (Math.PI * 2) / 96 }),
      '192': () => set({ speed: (Math.PI * 2) / 192 }),
      '384': () => set({ speed: (Math.PI * 2) / 384 }),
    }),
    speed: {
      value: (Math.PI * 2) / 12,
      min: 0,
      max: Math.PI,
      step: 0.001,
    },
    color: '#0096ff',
    opacity: {
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
    },
    width: {
      value: 30,
      min: 0,
      max: 100,
      step: 1,
    },
    erase: false,
    clear: button(() => {
      willClearRef.current = true
    }),
    note: {
      value: `ネットで見かけたろくろアートが気持ちよかったので。チカチカするので気をつけてね。`,
      editable: false,
    },
    ' ': buttonGroup({
      関連リンク: () => (location.href = 'https://pin.it/74HTb0Khk'),
    }),
  }))
  const speedRef = useRef(speed)
  const colorRef = useRef(color)
  const widthRef = useRef(width)
  const opacityRef = useRef(opacity)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rectRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef<number>(0)
  const pointsRef = useRef<Point | null>(null)
  const linesRef = useRef<{ start: Point; end: Point }[]>([])
  const lastPositionRef = useRef<Point | null>(null)
  const isDrawingRef = useRef(false)
  const isErasingRef = useRef(false)
  const willClearRef = useRef(false)
  const touchLeaveRev = useRef<Element | null>(null)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])
  useEffect(() => {
    colorRef.current = color
  }, [color])
  useEffect(() => {
    opacityRef.current = opacity
  })
  useEffect(() => {
    widthRef.current = width
  }, [width])
  useEffect(() => {
    isErasingRef.current = erase
  }, [erase])

  useEffect(() => {
    const canvas = canvasRef.current!
    const context = canvas.getContext('2d')!
    let animationFrameId = 0

    const animate = () => {
      rotationRef.current = (rotationRef.current + speedRef.current) % (Math.PI * 2)
      canvas.style.transform = `rotate(${rotationRef.current}rad)`

      if (willClearRef.current) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        willClearRef.current = false
      }

      context.save()
      // context.translate(canvas.width / 2, canvas.height / 2)
      // context.rotate(-rotationRef.current)
      // context.translate(-canvas.width / 2, -canvas.height / 2)

      context.globalAlpha = opacityRef.current
      if (isErasingRef.current) context.globalAlpha = 1

      // Draw points
      if (pointsRef.current && linesRef.current.length === 0) {
        const p = getRotatedCoordinates(pointsRef.current.x, pointsRef.current.y)
        context.beginPath()
        context.arc(p.x, p.y, widthRef.current * 0.5, 0, 2 * Math.PI)
        context.fillStyle = colorRef.current
        if (isErasingRef.current) context.fillStyle = 'white'
        context.fill()
      }

      // Draw lines
      linesRef.current.forEach((line) => {
        context.beginPath()
        const sp = getRotatedCoordinates(line.start.x, line.start.y)
        const ep = getRotatedCoordinates(line.end.x, line.end.y)
        context.moveTo(sp.x, sp.y)
        context.lineTo(ep.x, ep.y)
        context.strokeStyle = colorRef.current
        if (isErasingRef.current) context.strokeStyle = 'white'
        context.lineWidth = widthRef.current
        context.lineCap = 'round'
        context.stroke()
      })
      linesRef.current = []

      context.restore()

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    document.body.style.overflow = 'hidden'

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const getRotatedCoordinates = (x: number, y: number): Point => {
    const canvas = canvasRef.current!
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const rotatedX =
      Math.cos(-rotationRef.current) * (x - centerX) -
      Math.sin(-rotationRef.current) * (y - centerY) +
      centerX
    const rotatedY =
      Math.sin(-rotationRef.current) * (x - centerX) +
      Math.cos(-rotationRef.current) * (y - centerY) +
      centerY

    return { x: rotatedX, y: rotatedY }
  }

  const handleDown = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const isMouseEvent = 'clientX' in event
    const clientX = isMouseEvent
      ? (event as React.MouseEvent<HTMLCanvasElement>).clientX
      : (event as React.TouchEvent<HTMLCanvasElement>).touches[0]!.clientX
    const clientY = isMouseEvent
      ? (event as React.MouseEvent<HTMLCanvasElement>).clientY
      : (event as React.TouchEvent<HTMLCanvasElement>).touches[0]!.clientY

    const rect = rectRef.current!.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    pointsRef.current = { x, y }
    lastPositionRef.current = pointsRef.current
    isDrawingRef.current = true
    if (!isMouseEvent) touchLeaveRev.current = document.elementFromPoint(clientX, clientY)
  }

  const handleMove = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const isMouseEvent = 'clientX' in event
    const clientX = isMouseEvent
      ? (event as React.MouseEvent<HTMLCanvasElement>).clientX
      : (event as React.TouchEvent<HTMLCanvasElement>).touches[0]!.clientX
    const clientY = isMouseEvent
      ? (event as React.MouseEvent<HTMLCanvasElement>).clientY
      : (event as React.TouchEvent<HTMLCanvasElement>).touches[0]!.clientY

    mouseRef.current!.style.left = `${clientX - widthRef.current * 0.5}px`
    mouseRef.current!.style.top = `${clientY - widthRef.current * 0.5}px`

    if (!isDrawingRef.current) return
    const rect = rectRef.current!.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const ep = { x, y }

    linesRef.current.push({
      start: lastPositionRef.current as Point,
      end: ep,
    })

    pointsRef.current = ep
    lastPositionRef.current = ep

    if (!isMouseEvent && touchLeaveRev.current !== document.elementFromPoint(clientX, clientY))
      handleUp()
  }

  const handleUp = () => {
    pointsRef.current = null
    linesRef.current = []
    isDrawingRef.current = false
  }

  const handleMouseEnter = () => {
    if (!isMobile) mouseRef.current!.style.display = 'block'
  }
  const handleMouseLeave = () => {
    if (!isMobile) mouseRef.current!.style.display = 'none'
    handleUp()
  }

  return (
    <>
      <Leva
        hideCopyButton={true}
        collapsed={isMobile}
        titleBar={isMobile ? { position: { x: 10, y: -10 } } : true}
        theme={
          isMobile
            ? {
                sizes: {
                  titleBarHeight: '30px',
                },
              }
            : {}
        }
      />
      <div className="flex h-screen w-screen select-none items-center justify-center">
        <div ref={rectRef} className="absolute h-[600px] w-[600px]"></div>
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          onMouseEnter={handleMouseEnter}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
          className="rounded-full border border-gray-300"
        />
        <div
          ref={mouseRef}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: `${width}px`,
            height: `${width}px`,
            backgroundColor: erase ? 'white' : color,
            display: 'none',
            border: '1px solid black',
          }}
        ></div>
      </div>
    </>
  )
}

export default Zoetrope
