import React, { useState, useEffect } from 'react';
import supabase from '../../supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import MapPicker from '../../components/MapPicker';
import { 
  Users as UsersIcon, 
  Search, 
  Edit2, 
  Trash2, 
  UserX, 
  UserCheck, 
  MapPin, 
  ClipboardList, 
  X, 
  Check, 
  Mail, 
  Phone as PhoneIcon, 
  Clock 
} from 'lucide-react';

export const Users = () => {
  const { lang, isRtl } = useLanguage();
  
  // State variables
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Detail Overlay & Edit Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhoneSec, setEditPhoneSec] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState(null);
  const [editLng, setEditLng] = useState(null);

  // Load Users on Mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setUsersList(data || []);
    } catch (err) {
      console.error('Failed to load users', err);
      setErrorMsg(lang === 'ar' ? 'فشل تحميل قائمة المستخدمين.' : 'Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch User's complete order history
  const fetchUserOrders = async (userId) => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setUserOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchUserOrders(user.id);
  };

  // Open Edit Modal & Populate details
  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditName(user.full_name || '');
    setEditPhone(user.phone || '');
    setEditPhoneSec(user.phone_secondary || '');
    setEditUniversity(user.university || '');
    setEditCollege(user.college || '');
    setEditAddress(user.address_text || '');
    setEditLat(user.latitude ? parseFloat(user.latitude) : null);
    setEditLng(user.longitude ? parseFloat(user.longitude) : null);
    setIsEditModalOpen(true);
  };

  // Submit profile updates
  const handleUpdateUserSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          phone: editPhone,
          phone_secondary: editPhoneSec || null,
          university: editUniversity,
          college: editCollege,
          address_text: editAddress || null,
          latitude: editLat,
          longitude: editLng
        })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      setSuccessMsg(lang === 'ar' ? 'تم تحديث بيانات المستخدم بنجاح!' : 'User details updated successfully!');
      
      // Update local state directly
      setUsersList((prev) => 
        prev.map((u) => 
          u.id === selectedUser.id 
            ? { ...u, full_name: editName, phone: editPhone, phone_secondary: editPhoneSec, university: editUniversity, college: editCollege, address_text: editAddress, latitude: editLat, longitude: editLng }
            : u
        )
      );
      
      setIsEditModalOpen(false);
      
      // If selectedUser is open in sidebar details pane, refresh it
      setSelectedUser((prev) => 
        prev?.id === selectedUser.id 
          ? { ...prev, full_name: editName, phone: editPhone, phone_secondary: editPhoneSec, university: editUniversity, college: editCollege, address_text: editAddress, latitude: editLat, longitude: editLng }
          : prev
      );
    } catch (err) {
      console.error('Update user failed', err);
      setErrorMsg(lang === 'ar' ? 'فشل تحديث بيانات العميل.' : 'Failed to update user details.');
    }
  };

  // Toggle user active status (disable/enable)
  const handleToggleStatus = async (userRecord) => {
    setErrorMsg('');
    setSuccessMsg('');
    const newStatus = userRecord.status === 'disabled' ? 'active' : 'disabled';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userRecord.id);
        
      if (error) throw error;
      
      setSuccessMsg(
        lang === 'ar' 
          ? `تم ${newStatus === 'disabled' ? 'تعطيل' : 'تفعيل'} الحساب بنجاح!` 
          : `Account successfully ${newStatus === 'disabled' ? 'disabled' : 'enabled'}!`
      );
      
      // Update local list
      setUsersList((prev) => 
        prev.map((u) => u.id === userRecord.id ? { ...u, status: newStatus } : u)
      );
      
      // If open in details pane
      if (selectedUser?.id === userRecord.id) {
        setSelectedUser((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed status toggle', err);
      setErrorMsg(lang === 'ar' ? 'فشل تعديل حالة الحساب.' : 'Failed to toggle account status.');
    }
  };

  // Delete user account
  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm(
      lang === 'ar'
        ? 'هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً؟ ستفقد جميع تفاصيل الطلبات والمفضلة المرتبطة به.'
        : 'Are you sure you want to permanently delete this account? This will unlink their order history and favorites.'
    );
    
    if (!confirmDelete) return;
    
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      setSuccessMsg(lang === 'ar' ? 'تم حذف حساب المستخدم بنجاح!' : 'User account deleted successfully!');
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Delete user failed', err);
      setErrorMsg(lang === 'ar' ? 'حدث خطأ أثناء حذف الحساب.' : 'Error occurred deleting user.');
    }
  };

  // Search filter matching
  const filteredUsers = usersList.filter((userRecord) => {
    const query = searchTerm.toLowerCase();
    return (
      (userRecord.full_name || '').toLowerCase().includes(query) ||
      (userRecord.phone || '').toLowerCase().includes(query) ||
      (userRecord.email || '').toLowerCase().includes(query) ||
      (userRecord.university || '').toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UsersIcon size={24} style={{ color: 'var(--secondary)' }} />
          {lang === 'ar' ? 'إدارة حسابات المستخدمين' : 'Registered Users Management'}
        </h2>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Search & Statistics Pane */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} className="admin-toolbar">
        <div style={{ position: 'relative', flexGrow: 1 }}>
          <input
            type="text"
            className="form-input"
            placeholder={lang === 'ar' ? 'ابحث بالاسم، رقم الهاتف، أو البريد الإلكتروني...' : 'Search by name, phone, email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: isRtl ? '1rem' : '2.5rem', paddingRight: isRtl ? '2.5rem' : '1rem' }}
          />
          <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: '0.8rem', color: 'var(--text-muted)' }} />
        </div>

        <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent)', fontSize: '0.85rem', fontWeight: 700 }}>
          <span>{lang === 'ar' ? 'إجمالي الحسابات:' : 'Total Users:'}</span>
          <span style={{ color: 'var(--secondary)' }}>{usersList.length}</span>
        </div>
      </div>

      {/* Main Grid View (Table list + Sidebar details pane) */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1.4fr 1fr' : '1fr', gap: '1.5rem', transition: 'all 0.3s' }} className="users-layout-grid">
        
        {/* Users Table Card */}
        <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--surface-color)', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              {lang === 'ar' ? 'جاري تحميل المستخدمين...' : 'Loading user accounts...'}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              {lang === 'ar' ? 'لا توجد حسابات مستخدمين مطابقة.' : 'No matching user accounts found.'}
            </div>
          ) : (
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</th>
                  <th style={{ padding: '0.75rem' }}>{lang === 'ar' ? 'بيانات الاتصال' : 'Contact Details'}</th>
                  <th style={{ padding: '0.75rem' }}>{lang === 'ar' ? 'الجامعة / الكلية' : 'University / College'}</th>
                  <th style={{ padding: '0.75rem' }}>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userRecord) => (
                  <tr 
                    key={userRecord.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)', 
                      fontSize: '0.85rem', 
                      backgroundColor: selectedUser?.id === userRecord.id ? 'var(--accent)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSelectUser(userRecord)}
                  >
                    <td style={{ padding: '0.8rem 0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      <div>{userRecord.full_name}</div>
                      {userRecord.role === 'admin' && (
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', backgroundColor: 'var(--secondary)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>ADMIN</span>
                      )}
                    </td>
                    <td style={{ padding: '0.8rem 0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><PhoneIcon size={12} /> {userRecord.phone}</span>
                        {userRecord.email && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><Mail size={12} /> {userRecord.email}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '0.8rem 0.75rem' }}>
                      <div style={{ fontSize: '0.8rem' }}>{userRecord.university}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{userRecord.college}</div>
                    </td>
                    <td style={{ padding: '0.8rem 0.75rem' }}>
                      {userRecord.status === 'disabled' ? (
                        <span style={{ color: 'var(--danger)', backgroundColor: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 'bold' }}>
                          {lang === 'ar' ? 'معطل' : 'Disabled'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)', backgroundColor: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 'bold' }}>
                          {lang === 'ar' ? 'نشط' : 'Active'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.8rem 0.75rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        {/* Edit Details */}
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleOpenEdit(userRecord)} 
                          style={{ padding: '0.3rem', border: 'none', color: 'var(--secondary)' }}
                          title={lang === 'ar' ? 'تعديل البيانات' : 'Edit details'}
                        >
                          <Edit2 size={15} />
                        </button>
                        
                        {/* Disable/Enable */}
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleToggleStatus(userRecord)}
                          style={{ padding: '0.3rem', border: 'none', color: userRecord.status === 'disabled' ? 'var(--success)' : 'var(--danger)' }}
                          title={userRecord.status === 'disabled' ? (lang === 'ar' ? 'تفعيل الحساب' : 'Enable account') : (lang === 'ar' ? 'تعطيل الحساب' : 'Disable account')}
                        >
                          {userRecord.status === 'disabled' ? <UserCheck size={16} /> : <UserX size={16} />}
                        </button>
                        
                        {/* Delete Account */}
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleDeleteUser(userRecord.id)}
                          style={{ padding: '0.3rem', border: 'none', color: 'var(--danger)' }}
                          title={lang === 'ar' ? 'حذف الحساب نهائياً' : 'Delete account'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected User Details Sidebar Pane */}
        {selectedUser && (
          <div className="card animate-fade-in" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
            
            {/* Header close trigger */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                {lang === 'ar' ? 'تفاصيل الحساب' : 'User Account Details'}
              </h3>
              <button 
                onClick={() => setSelectedUser(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile recap block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div>
                <strong>{lang === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</strong> {selectedUser.full_name}
              </div>
              {selectedUser.email && (
                <div>
                  <strong>{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email Address:'}</strong> {selectedUser.email}
                </div>
              )}
              <div>
                <strong>{lang === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</strong> {selectedUser.phone}
              </div>
              {selectedUser.phone_secondary && (
                <div>
                  <strong>{lang === 'ar' ? 'رقم الهاتف الاحتياطي:' : 'Secondary Phone:'}</strong> {selectedUser.phone_secondary}
                </div>
              )}
              <div>
                <strong>{lang === 'ar' ? 'الجامعة:' : 'University:'}</strong> {selectedUser.university}
              </div>
              <div>
                <strong>{lang === 'ar' ? 'الكلية:' : 'College:'}</strong> {selectedUser.college}
              </div>
            </div>

            {/* Address text and pinned map preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={16} style={{ color: 'var(--secondary)' }} />
                {lang === 'ar' ? 'العنوان الجغرافي' : 'Location Address'}
              </h4>

              {selectedUser.address_text ? (
                <>
                  <div style={{ fontSize: '0.8rem', backgroundColor: 'var(--accent)', padding: '0.5rem', borderRadius: '4px', lineHeight: 1.4, fontWeight: 600 }}>
                    📍 {selectedUser.address_text}
                  </div>
                  {selectedUser.latitude && selectedUser.longitude && (
                    <MapPicker
                      latitude={selectedUser.latitude}
                      longitude={selectedUser.longitude}
                      readOnly={true}
                      height="180px"
                    />
                  )}
                </>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {lang === 'ar' ? 'لم يحدد هذا المستخدم موقعه على الخريطة.' : 'No map location has been saved by this user.'}
                </div>
              )}
            </div>

            {/* User Order history list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ClipboardList size={16} style={{ color: 'var(--secondary)' }} />
                {lang === 'ar' ? 'سجل الطلبات' : 'Order History'}
              </h4>

              {loadingOrders ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {lang === 'ar' ? 'جاري تحميل سجل الطلبات...' : 'Loading orders...'}
                </div>
              ) : userOrders.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {lang === 'ar' ? 'لا توجد طلبات سابقة لهذا المستخدم.' : 'No orders found for this user.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {userOrders.map((order) => (
                    <div 
                      key={order.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.5rem', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.78rem' 
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>#{order.order_number}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={10} /> {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-LY' : 'en-US')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 700 }}>{order.total_price} د.ل</span>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '1px 5px', 
                          borderRadius: '4px',
                          color: order.status === 'delivered' ? 'var(--success)' : (order.status === 'cancelled' ? 'var(--danger)' : 'var(--secondary)'),
                          backgroundColor: 'var(--accent)'
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Edit User Form Dialog Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: '1rem' }} className="no-print animate-fade-in">
          <div className="card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface-color)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                {lang === 'ar' ? 'تعديل بيانات المستخدم' : 'Edit User Profile'}
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              {/* Phone & Secondary Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{lang === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{lang === 'ar' ? 'الهاتف الاحتياطي' : 'Secondary Phone'}</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={editPhoneSec}
                    onChange={(e) => setEditPhoneSec(e.target.value)}
                  />
                </div>
              </div>

              {/* University & College */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{lang === 'ar' ? 'الجامعة *' : 'University *'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editUniversity}
                    onChange={(e) => setEditUniversity(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{lang === 'ar' ? 'الكلية *' : 'College *'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                  />
                </div>
              </div>

              {/* Address Map Picker */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{lang === 'ar' ? 'العنوان الجغرافي الخريطة' : 'Map Address Pin'}</label>
                {editAddress && (
                  <div style={{ fontSize: '0.78rem', backgroundColor: 'var(--accent)', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem', lineHeight: 1.4, fontWeight: 600 }}>
                    📍 {editAddress}
                  </div>
                )}
                <MapPicker
                  latitude={editLat}
                  longitude={editLng}
                  onLocationSelect={({ lat, lng, address }) => {
                    setEditLat(lat);
                    setEditLng(lng);
                    setEditAddress(address);
                  }}
                  height="160px"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsEditModalOpen(false)}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      <style>{`
        .admin-table th, .admin-table td {
          border-bottom: 1px solid var(--border-color);
        }
        @media (max-width: 990px) {
          .users-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 580px) {
          .admin-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Users;
