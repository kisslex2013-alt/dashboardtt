import React from 'react'
import '../styles/updateModal.css'

export function UpdateModal({
  countdown,
  progress,
  changelog,
  onUpdateNow,
  onLater,
}) {
  return (
    <div className="update-overlay">
      <div className="update-card">
        <h2 style={{ marginBottom: '10px' }}>Новая версия доступна</h2>
        <p style={{ opacity: 0.85 }}>Обновление через {countdown} сек…</p>

        {changelog && changelog.length > 0 && (
          <div
            style={{
              textAlign: 'left',
              marginTop: '15px',
              background: 'rgba(255,255,255,0.05)',
              padding: '10px',
              borderRadius: '8px',
              maxHeight: '100px',
              overflowY: 'auto',
              fontSize: '13px',
            }}
          >
            <b>Изменения:</b>
            <ul>
              {changelog.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="update-progress-container">
          <div
            className="update-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="update-buttons">
          <button className="update-btn" onClick={onUpdateNow}>
            Обновить сейчас
          </button>
          <button className="update-btn-later" onClick={onLater}>
            Позже
          </button>
        </div>
      </div>
    </div>
  )
}

