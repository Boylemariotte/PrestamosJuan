import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Check, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { authService } from '../services/api';

const Perfil = () => {
    const { user, setUser } = useAuth();
    const [basicInfo, setBasicInfo] = useState({
        nombre: '',
        email: '',
        username: '' // Read only
    });

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loadingInfo, setLoadingInfo] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setBasicInfo({
                nombre: user.nombre || '',
                email: user.email || '',
                username: user.username || ''
            });
        }
    }, [user]);

    const handleInfoChange = (e) => {
        setBasicInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setMessage({ type: '', text: '' });
    };

    const handlePassChange = (e) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setMessage({ type: '', text: '' });
    };

    const updateBasicInfo = async (e) => {
        e.preventDefault();
        setLoadingInfo(true);
        setMessage({ type: '', text: '' });

        try {
            // Usar endpoint de actualizar persona (usuario actual puede actualizarse a sí mismo)
            const response = await api.put(`/personas/${user.id}`, {
                nombre: basicInfo.nombre,
                email: basicInfo.email
            });

            if (response.success) {
                setMessage({ type: 'success', text: 'Información actualizada correctamente' });
                // Actualizar contexto y local storage si es necesario
                // El backend devuelve el usuario actualizado en data
                const updatedUser = { ...user, nombre: response.data.nombre, email: response.data.email };

                // Actualizar el estado global/localstorage simulando login o re-fetch
                // Nota: AuthContext debería proveer una forma de actualizar el usuario sin relogin, 
                // pero por ahora asumimos que el usuario debe refrescar o implementamos uin hack simple
                localStorage.setItem('auth_user', JSON.stringify(updatedUser));
                // Forzamos actualización visual si el contexto no lo hace automático (depende de implementación AuthContext)
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.message || 'Error al actualizar información' });
        } finally {
            setLoadingInfo(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
            return;
        }

        setLoadingPass(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await authService.changePassword(passwords.currentPassword, passwords.newPassword);
            if (response.success) {
                setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
        } finally {
            setLoadingPass(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mi Perfil</h1>
                <p className="text-sm text-gray-500 mt-1">Administra tu información personal y seguridad</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg flex items-start gap-3 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {message.type === 'success' ? <Check className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Información Básica */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                    <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <User className="h-5 w-5 text-sky-600" />
                            Información Personal
                        </h2>
                    </div>

                    <form onSubmit={updateBasicInfo} className="p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Usuario (No editable)
                            </label>
                            <input
                                type="text"
                                value={basicInfo.username}
                                disabled
                                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre Completo
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <User className="h-4 w-4" />
                                </span>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={basicInfo.nombre}
                                    onChange={handleInfoChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Mail className="h-4 w-4" />
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    value={basicInfo.email}
                                    onChange={handleInfoChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loadingInfo}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-70"
                            >
                                {loadingInfo ? 'Guardando...' : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Cambio de Contraseña */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                    <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Lock className="h-5 w-5 text-orange-600" />
                            Seguridad
                        </h2>
                    </div>

                    <form onSubmit={changePassword} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña Actual
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwords.currentPassword}
                                onChange={handlePassChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nueva Contraseña
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwords.newPassword}
                                onChange={handlePassChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Nueva Contraseña
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwords.confirmPassword}
                                onChange={handlePassChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loadingPass}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-70"
                            >
                                {loadingPass ? 'Actualizando...' : 'Actualizar Contraseña'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Perfil;
