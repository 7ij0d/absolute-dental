import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Uncaught Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '4rem 1.5rem',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyInbound: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: 'var(--bg-color, #f8fafc)',
          color: 'var(--text-main, #1e293b)',
          direction: 'rtl',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: '#ffffff',
            padding: '2.5rem',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f766e', marginBottom: '0.75rem' }}>
              حدثت مشكلة أثناء تحميل الصفحة
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              تم مواجهة خطأ غير متوقع. اضغط على الزر أدناه لإعادة تنشيط التطبيق فوراً.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                backgroundColor: '#00a896',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.75rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 168, 150, 0.3)'
              }}
            >
              إعادة تحميل الصفحة 🔄
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
