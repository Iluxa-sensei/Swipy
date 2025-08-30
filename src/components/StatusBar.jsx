import React, { useState, useEffect } from 'react'

const StatusBar = () => {
  const [currentTime, setCurrentTime] = useState('9:41')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      setCurrentTime(`${hours}:${minutes.toString().padStart(2, '0')}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Обновляем каждую минуту

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="status-bar">
      <div className="status-left">
        <span>{currentTime}</span>
      </div>
      <div className="status-center">
        <div className="signal-bars">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      </div>
      <div className="status-right">
        <span>100%</span>
        <div className="battery">
          <div className="battery-level"></div>
        </div>
      </div>
    </div>
  )
}

export default StatusBar

