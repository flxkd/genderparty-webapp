import {useState} from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

import WebApp from '@twa-dev/sdk'
import QRCode from "react-qr-code";

function App() {
    const [title, setTitle] = useState('');
    const [gender, setGender] = useState<'boy' | 'girl' | null>(null);
    const [date, setDate] = useState<string>('');
    const [showQR, setShowQR] = useState(false);

    const generateQRData = () => {
        return `https://your-domain.com/webar?title=${encodeURIComponent(title)}&gender=${gender}&date=${date}`;
    };

    const handleGenerate = async () => {
        if (!title || !gender || !date) {
            WebApp.showAlert('Пожалуйста, заполните все поля');
            return;
        }

        // Отправляем JSON на бекенд
        try {
            await fetch('https://your-backend.com/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    gender,
                    date,
                }),
            });
        } catch (error) {
            console.error('Ошибка при отправке данных:', error);
            WebApp.showAlert('Не удалось отправить данные на сервер');
            return;
        }

        setShowQR(true);
    };

    return (
        <div className="container">
            <h1>🎉 Gender Party QR</h1>

            <input
                type="text"
                placeholder="Название Gender Party"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <div className="card">
                <button onClick={() => setGender('boy')}>👶 Мальчик</button>
                <button onClick={() => setGender('girl')}>🎀 Девочка</button>
            </div>

            <h5>reveal date</h5>
            <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />

            <div className="card">
                <button onClick={handleGenerate}>
                    📱 Сгенерировать QR для WebAR
                </button>
            </div>

            {showQR && (
                <div className="qr-code">
                    <QRCode value={generateQRData()} size={200}/>
                </div>
            )}
        </div>
    );
}

export default App;
