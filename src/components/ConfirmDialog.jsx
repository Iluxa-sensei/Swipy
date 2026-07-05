import React from 'react'

const ConfirmDialog = ({
    open,
    title = 'Confirm Action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="w-full max-w-sm bg-bg-secondary rounded-3xl p-6 shadow-2xl border border-glass-border">
                <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-500/20' : 'bg-accent-primary/20'}`}>
                        <i className={`fas fa-exclamation-triangle text-2xl ${danger ? 'text-red-400' : 'text-accent-primary'}`}></i>
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{message}</p>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-3 px-4 bg-glass-bg border border-glass-border text-text-primary rounded-xl font-medium hover:bg-glass-border transition-all duration-200 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-3 px-4 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-accent-primary hover:bg-accent-primary/90'}`}
                    >
                        {loading ? 'Please wait...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
