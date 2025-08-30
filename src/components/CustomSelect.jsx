import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({ options, placeholder, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const dropdownRef = useRef(null);

    useEffect(() => {
        // Обновляем выбранное значение, если оно изменилось извне
        if (value !== undefined) {
            setSelectedValue(value);
        }
    }, [value]);

    useEffect(() => {
        // Добавляем обработчик клика вне компонента для закрытия выпадающего списка
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option) => {
        setSelectedValue(option);
        setIsOpen(false);
        if (onChange) {
            onChange(option);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className={`w-full p-4 bg-glass-bg border ${isOpen ? 'border-accent-primary' : 'border-glass-border'} rounded-2xl text-text-primary flex justify-between items-center cursor-pointer transition-all duration-300 hover:border-accent-primary/70`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedValue ? 'text-text-primary' : 'text-text-secondary'}>
                    {selectedValue || placeholder}
                </span>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent-primary' : 'text-text-secondary'}`}></i>
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-2 py-2 bg-bg-secondary border border-glass-border rounded-2xl shadow-lg z-50 max-h-60 overflow-y-auto animate-fade-in">
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className={`px-4 py-3 cursor-pointer transition-all duration-200 ${selectedValue === option ? 'bg-accent-primary/20 text-accent-primary' : 'hover:bg-glass-bg text-text-primary'}`}
                            onClick={() => handleSelect(option)}
                        >
                            <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {selectedValue === option && <i className="fas fa-check text-accent-primary"></i>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;











