import React, { useState, useEffect } from 'react';
import { UserPlus, User, Mail, Lock, Check, AlertCircle, Briefcase, ChevronDown, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const GestionUsuarios = () => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // Formulario de creación
    const [formData, setFormData] = useState({
        username: '',
        nombre: '',
        email: '',
        password: '',
        role: 'domiciliario',
        ciudad: ''
    });

    // Estado para edición
    const [editingUser, setEditingUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados para manejo de contraseñas
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    // Bloquear scroll del cuerpo cuando el modal está abierto
    useEffect(() => {
        if (isEditModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isEditModalOpen]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await api.get('/personas');
            if (response.success) {
                setUsers(response.data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Error al cargar la lista de usuarios');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (isEditModalOpen) {
            const updatedUser = { ...editingUser, [name]: value };
            // Si se cambia el rol y no es domiciliario ni supervisor, limpiar ciudad
            if (name === 'role' && value !== 'domiciliario' && value !== 'supervisor') {
                updatedUser.ciudad = '';
            }
            setEditingUser(updatedUser);
        } else {
            const updatedData = { ...formData, [name]: value };
            // Si se cambia el rol y no es domiciliario ni supervisor, limpiar ciudad
            if (name === 'role' && value !== 'domiciliario' && value !== 'supervisor') {
                updatedData.ciudad = '';
            }
            setFormData(updatedData);
        }
        setError('');
        setSuccess('');
    };

    const handleSubmitCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Preparar datos para enviar, incluyendo ciudad solo si es domiciliario o supervisor
            const dataToSend = {
                ...formData,
                ...((formData.role !== 'domiciliario' && formData.role !== 'supervisor') && { ciudad: undefined })
            };
            const response = await api.post('/personas', dataToSend);
            if (response.success) {
                setSuccess('Usuario creado exitosamente');
                setFormData({
                    username: '',
                    nombre: '',
                    email: '',
                    password: '',
                    role: 'domiciliario',
                    ciudad: ''
                });
                fetchUsers(); // Recargar lista
            }
        } catch (err) {
            setError(err.message || 'Error al crear usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
        setError('');
        setSuccess('');
        // Limpiar estados de contraseña
        setShowPassword(false);
        setShowConfirmPassword(false);
        setConfirmPassword('');
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validar contraseñas si se está cambiando
            if (editingUser.password) {
                if (!confirmPassword) {
                    setError('Por favor confirma la nueva contraseña');
                    setLoading(false);
                    return;
                }
                if (editingUser.password !== confirmPassword) {
                    setError('Las contraseñas no coinciden');
                    setLoading(false);
                    return;
                }
                if (editingUser.password.length < 6) {
                    setError('La contraseña debe tener al menos 6 caracteres');
                    setLoading(false);
                    return;
                }
            }

            // Solo enviamos los campos que se pueden actualizar: nombre, email, username, role, activo, ciudad
            // Nota: El backend permite actualizar estos campos si eres CEO
            const payload = {
                nombre: editingUser.nombre,
                email: editingUser.email,
                username: editingUser.username, // Agregado el campo username para inicio de sesión
                role: editingUser.role,
                activo: editingUser.activo,
                ...(editingUser.role === 'domiciliario' || editingUser.role === 'supervisor') && editingUser.ciudad && { ciudad: editingUser.ciudad },
                ...(editingUser.role === 'domiciliario' && { ocultarProrroga: editingUser.ocultarProrroga }), // Add ocultarProrroga if domiciliario
                ...(editingUser.password && { password: editingUser.password }) // Solo enviar contraseña si se proporcionó
            };
            const response = await api.put(`/personas/${editingUser.id}`, payload);
            if (response.success) {
                setSuccess('Usuario actualizado exitosamente');
                setIsEditModalOpen(false);
                fetchUsers();
            } else {
                setError('Error al actualizar usuario');
            }
        } catch (err) {
            console.error('Error updating user:', err);
            setError('Error al actualizar usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

        try {
            await api.delete(`/personas/${userId}`);
            fetchUsers();
            setSuccess('Usuario eliminado correctamente');
        } catch (err) {
            setError(err.message || 'Error al eliminar usuario');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-sm text-gray-500 mt-1">Crea, edita y administra los usuarios del sistema</p>
                </div>
            </div>

            {/* Mensajes de feedback globales */}
            {(error && !isEditModalOpen) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {(success) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Columna Izquierda: Lista de Usuarios (Ocupa 2 espacios en pantallas grandes) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Usuarios Registrados
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            {loadingUsers ? (
                                <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>
                            ) : users.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No hay usuarios registrados</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                            <th className="p-4 font-semibold">Usuario</th>
                                            <th className="p-4 font-semibold">Rol</th>
                                            <th className="p-4 font-semibold">Estado</th>
                                            <th className="p-4 font-semibold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-medium text-gray-900">{user.nombre}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                    <p className="text-xs text-blue-500">@{user.username}</p>
                                                    {(user.role === 'domiciliario' || user.role === 'supervisor') && user.ciudad && (
                                                        <p className="text-xs text-gray-400 mt-1">📍 {user.ciudad}</p>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${user.role === 'ceo' ? 'bg-purple-100 text-purple-800' :
                                                            user.role === 'administrador' ? 'bg-blue-100 text-blue-800' :
                                                                user.role === 'supervisor' ? 'bg-indigo-100 text-indigo-800' :
                                                                    'bg-sky-100 text-sky-800'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {user.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleEditClick(user)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    {user.role !== 'ceo' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formulario de Creación (Ocupa 1 espacio) */}
                <div className="xl:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-sky-600" />
                                Nuevo Usuario
                            </h2>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmitCreate} className="space-y-4">
                                {/* Formulario abreviado (vertical) para el sidebar */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500" placeholder="Nombre completo" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500" placeholder="username" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500" placeholder="correo@ejemplo.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500" placeholder="••••••••" minLength={6} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                    <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-sky-500">
                                        <option value="domiciliario">Domiciliario</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="administrador">Administrador</option>
                                    </select>
                                </div>

                                {(formData.role === 'domiciliario' || formData.role === 'supervisor') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                                        <select name="ciudad" value={formData.ciudad} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-sky-500">
                                            <option value="">Seleccione una ciudad</option>
                                            <option value="Tuluá">Tuluá</option>
                                            <option value="Guadalajara de Buga">Guadalajara de Buga</option>
                                        </select>
                                    </div>
                                )}

                                <button type="submit" disabled={loading} className="w-full py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium">
                                    {loading ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Edición */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
                        {/* Header Fijo */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                            <h3 className="text-xl font-bold text-slate-800">Editar Usuario</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenido con Scroll - Aseguramos que el scroll sea interno */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white min-h-0 custom-scrollbar">
                            <form onSubmit={handleUpdateUser} id="edit-user-form" className="space-y-6">
                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 italic">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                    <input type="text" name="nombre" value={editingUser.nombre} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500 focus:border-sky-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" name="email" value={editingUser.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500 focus:border-sky-500" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                        <select name="role" value={editingUser.role} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-sky-500">
                                            <option value="domiciliario">Domiciliario</option>
                                            <option value="supervisor">Supervisor</option>
                                            <option value="administrador">Administrador</option>
                                            {editingUser.role === 'ceo' && <option value="ceo">CEO</option>}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                        <select
                                            name="activo"
                                            value={editingUser.activo}
                                            onChange={(e) => {
                                                setEditingUser(prev => ({ ...prev, activo: e.target.value === 'true' }));
                                            }}
                                            className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-sky-500"
                                        >
                                            <option value="true">Activo</option>
                                            <option value="false">Inactivo</option>
                                        </select>
                                    </div>
                                </div>

                                {(editingUser.role === 'domiciliario' || editingUser.role === 'supervisor') && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                                            <select name="ciudad" value={editingUser.ciudad || ''} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-sky-500">
                                                <option value="">Seleccione una ciudad</option>
                                                <option value="Tuluá">Tuluá</option>
                                                <option value="Guadalajara de Buga">Guadalajara de Buga</option>
                                            </select>
                                        </div>
                                        {editingUser.role === 'domiciliario' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Ocultar prórroga</label>
                                                <select
                                                    name="ocultarProrroga"
                                                    value={editingUser.ocultarProrroga === undefined ? true : editingUser.ocultarProrroga}
                                                    onChange={(e) => {
                                                        setEditingUser(prev => ({ ...prev, ocultarProrroga: e.target.value === 'true' }));
                                                    }}
                                                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-sky-500"
                                                >
                                                    <option value="true">Sí (Ocultar)</option>
                                                    <option value="false">No (Mostrar)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                                    <input type="text" name="username" value={editingUser.username} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500 focus:border-sky-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nueva Contraseña
                                        <span className="text-xs text-gray-500 font-normal ml-1">(Opcional)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-sky-500"
                                            placeholder="Solo si deseas cambiarla"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {editingUser.password && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirmar Contraseña
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-sky-500"
                                                placeholder="Repite la nueva contraseña"
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && editingUser.password !== confirmPassword && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Las contraseñas no coinciden
                                            </p>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Footer Fijo */}
                        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 flex-shrink-0">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                                Cancelar
                            </button>
                            <button form="edit-user-form" type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all font-bold disabled:opacity-50">
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionUsuarios;
