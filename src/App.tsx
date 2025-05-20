import './App.css'
import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type TelegramUser = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
};

function App() {
    const [title, setTitle] = useState('');
    const [gender, setGender] = useState<'boy' | 'girl' | null>(null);
    const [showQR, setShowQR] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [timezoneOffset, setTimezoneOffset] = useState<string>('');
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [qrUrl, setQrUrl] = useState<string>('');

    useEffect(() => {
        const offsetInMinutes = new Date().getTimezoneOffset();
        const hours = Math.floor(Math.abs(offsetInMinutes) / 60)
            .toString()
            .padStart(2, '0');
        const minutes = (Math.abs(offsetInMinutes) % 60).toString().padStart(2, '0');
        const sign = offsetInMinutes <= 0 ? '+' : '-';
        setTimezoneOffset(`${sign}${hours}:${minutes}`);

        // Получаем данные пользователя из Telegram WebApp
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initDataUnsafe?.user) {
            setUser(tg.initDataUnsafe.user);
        }
    }, []);

    const dateTime = selectedDate?.toISOString() ?? '';

    const handleGenerate = async () => {
        if (!user) {
            WebApp.showAlert('Данные пользователя Telegram не загружены.');
            return;
        }
        if (!gender || !selectedDate) {
            WebApp.showAlert('Пожалуйста, выберите пол и дату.');
            return;
        }

        try {
            const response = await fetch('https://your-backend.com/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    telegramId: user.id,
                    username: user.username ?? null,
                    gender,
                    dateTime,
                    timezoneOffset,
                    // Можно также отправить название вечеринки, если нужно:
                    // title,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.url) {
                setQrUrl(data.url);
                setShowQR(true);
            } else {
                WebApp.showAlert('В ответе от сервера нет ссылки на QR код');
            }
        } catch (error) {
            console.error(error);
            WebApp.showAlert('Не удалось отправить данные на сервер');
        }
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
                <button
                    onClick={() => setGender('boy')}
                    disabled={gender !== null}
                    style={{
                        backgroundColor: gender !== null ? '#999' : undefined,
                        color: gender !== null ? '#fff' : undefined,
                        cursor: gender !== null ? 'default' : 'pointer',
                        pointerEvents: gender !== null ? 'none' : 'auto',
                    }}
                >
                    👶 Мальчик
                </button>
                <button
                    onClick={() => setGender('girl')}
                    disabled={gender !== null}
                    style={{
                        backgroundColor: gender !== null ? '#999' : undefined,
                        color: gender !== null ? '#fff' : undefined,
                        cursor: gender !== null ? 'default' : 'pointer',
                        pointerEvents: gender !== null ? 'none' : 'auto',
                    }}
                >
                    🎀 Девочка
                </button>
            </div>

            {gender !== null && (
                <p style={{ marginTop: '8px', fontStyle: 'italic', color: '#555' }}>
                    Пол выбран
                </p>
            )}

            <div className="container">
                <label>Дата и время события:</label>
                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="Pp"
                    placeholderText="Выберите дату и время"
                />

                <p>Ваш часовой пояс: GMT{timezoneOffset}</p>
            </div>

            <div className="card">
                <button onClick={handleGenerate}>
                    📱 Сгенерировать QR для WebAR
                </button>
            </div>

            {showQR && qrUrl && (
                <div className="qr-code">
                    <h5>QR CODE</h5>
                    <img src={qrUrl} alt="QR Code" width={200} height={200} />
                </div>
            )}
        </div>
    );
}

export default App;
