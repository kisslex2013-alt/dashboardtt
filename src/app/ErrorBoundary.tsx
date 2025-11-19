import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Runtime error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20 }}>
          <h2>Произошла ошибка</h2>
          <p>Попробуйте обновить страницу.</p>
        </div>
      )
    }

    return this.props.children
  }
}

