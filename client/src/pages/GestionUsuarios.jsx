import React, { useState, useEffect } from 'react';
import { UserPlus, User, Mail, Lock, Check, AlertCircle, Briefcase, ChevronDown, Edit2, Trash2, X } from 'lucide-react';
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
        role: 'domiciliario'
    });

    // Estado para edición
    const [editingUser, setEditingUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
            setEditingUser(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
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
            const response = await api.post('/personas', formData);
            if (response.success) {
                setSuccess('Usuario creado exitosamente');
                setFormData({
                    username: '',
                    nombre: '',
                    email: '',
                    password: '',
                    role: 'domiciliario'
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
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Solo enviamos los campos que se pueden actualizar: nombre, email, role, activo
            // Nota: El backend permite actualizar estos campos si eres CEO
            const payload = {
                nombre: editingUser.nombre,
                email: editingUser.email,
                username: editingUser.username,
                role: editingUser.role,
                activo: editingUser.activo,
                ...(editingUser.password && { password: editingUser.password }) // Add password if exists
            };

            const response = await api.put(`/personas/${editingUser.id}`, payload);
            if (response.success) {
                setSuccess('Usuario actualizado correctamente');
                setIsEditModalOpen(false);
                fetchUsers();
            }
        } catch (err) {
            // Si falla, mostrar error en el modal o general
            // Para simplificar, lo mostramos en la alerta principal si el modal se cierra, 
            // o podríamos añadir un estado de error específico para el modal.
            setError(err.message || 'Error al actualizar usuario');
            // No cerramos el modal para que el usuario pueda corregir
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
                                                <div className="p-4">
                                                    <p className="font-medium text-gray-900">{user.nombre}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                    <p className="text-xs text-blue-500">@{user.username}</p>
                                                </div>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${user.role === 'ceo' ? 'bg-purple-100 text-purple-800' :
                                                            user.role === 'administrador' ? 'bg-blue-100 text-blue-800' :
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
                                        <option value="administrador">Administrador</option>
                                    </select>
                                </div>

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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Editar Usuario</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input type="text" name="nombre" value={editingUser.nombre} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" name="email" value={editingUser.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                    <select name="role" value={editingUser.role} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-sky-500">
                                        <option value="domiciliario">Domiciliario</option>
                                        <option value="administrador">Administrador</option>
                                        {/* CEO solo puede ser asignado si ya es CEO o por base de datos, 
                                            pero aquí permitimos mantenerlo si ya lo es */}
                                        {editingUser.role === 'ceo' && <option value="ceo">CEO</option>}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select
                                        name="activo"
                                        value={editingUser.activo}
                                        onChange={(e) => {
                                            setEditingUser(prev => ({ ...prev, activo: val }));
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-sky-500"
                                    >
                                        <option value="true">Activo</option>
                                        <option value="false">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                                <input type="text" name="username" value={editingUser.username} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nueva Contraseña
                                    <span className="text-xs text-gray-500 font-normal ml-1">(Dejar en blanco para no cambiar)</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-sky-500"
                                    placeholder="Nueva contraseña"
                                    minLength={6}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionUsuarios;
