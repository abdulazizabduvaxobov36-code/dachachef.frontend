import { Box, Button, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaMapMarkerAlt } from 'react-icons/fa';
import Store from '../store';

const DISTRICTS = [
    'Andijan shahri', 'Oltinko\'l', 'Asaka', 'Baliqchi', 'Bo\'ston', 'Buloqboshi',
    'Izboskan', 'Jalolquduq', 'Xo\'jaobod', 'Marhamat', 'Mashrabov', 'Paxtaobod',
    'Qo\'rg\'ontepa', 'Shahrixon', 'Ulug\'nor'
];

const emptyDacha = () => ({
    id: '', name: '', district: 'Andijan shahri', address: '', capacity: '', description: '', phone: ''
});

const AdminDachasPage = () => {
    const navigate = useNavigate();
    const [dachas, setDachas] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null); // dacha id yoki null
    const [form, setForm] = useState(emptyDacha());
    const [errors, setErrors] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const reload = () => setDachas(Store.getDachas());

    useEffect(() => {
        reload();
        window.addEventListener('dachas-updated', reload);
        return () => window.removeEventListener('dachas-updated', reload);
    }, []);

    const openAdd = () => {
        setForm(emptyDacha());
        setEditing(null);
        setErrors({});
        setShowForm(true);
    };

    const openEdit = (dacha) => {
        setForm({ ...dacha });
        setEditing(dacha.id);
        setErrors({});
        setShowForm(true);
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Dacha nomi shart";
        if (!form.district) e.district = "Tuman shart";
        if (form.capacity && isNaN(Number(form.capacity))) e.capacity = "Raqam kiriting";
        return e;
    };

    const handleSave = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        if (editing) {
            Store.updateDacha(editing, { ...form });
        } else {
            Store.addDacha({ ...form, id: Date.now().toString() });
        }
        setShowForm(false);
        setEditing(null);
        reload();
    };

    const handleDelete = (id) => {
        Store.removeDacha(id);
        setDeleteConfirm(null);
        reload();
    };

    const updateForm = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    };

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            {/* Header */}
            <Box bgColor="white" px={{ base: "14px", sm: "18px" }} py={{ base: "12px", sm: "14px" }}
                display="flex" alignItems="center" justifyContent="space-between" boxShadow="0 1px 0 #F0EBE6">
                <Box display="flex" alignItems="center" gap="12px">
                    <Box bgColor="#FFF0EC" borderRadius="full" display="flex" alignItems="center"
                        justifyContent="center" cursor="pointer" onClick={() => navigate('/admin')}
                        style={{ width: "clamp(32px, 9vw, 38px)", height: "clamp(32px, 9vw, 38px)" }}>
                        <FaArrowLeft style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "#1C110D" }} />
                    </Box>
                    <Box>
                        <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(15px, 4.2vw, 18px)" }}>
                            Dachalar boshqaruvi
                        </Text>
                        <Text fontSize="12px" color="#9B614B">{dachas.length} ta dacha</Text>
                    </Box>
                </Box>
                <Button bgColor="#C03F0C" color="white" borderRadius="14px"
                    size="sm" fontWeight="700" onClick={openAdd}
                    leftIcon={<FaPlus size={11} />} _hover={{ bgColor: "#a0300a" }}>
                    Qo'shish
                </Button>
            </Box>

            <Box pb="30px" px={{ base: "14px", sm: "16px" }}>
                {dachas.length === 0 && !showForm && (
                    <Box mt="60px" textAlign="center">
                        <FaMapMarkerAlt size={50} color="#E8D5CC" style={{ margin: '0 auto 14px' }} />
                        <Text color="#9B8E8A" fontWeight="700" fontSize="16px">Hali dacha qo'shilmagan</Text>
                        <Text color="#9B8E8A" fontSize="13px" mt="6px" mb="20px">
                            Andijondagi dachalarni qo'shing — oshpazlar va mijozlar ko'radi
                        </Text>
                        <Button bgColor="#C03F0C" color="white" borderRadius="16px"
                            fontWeight="700" onClick={openAdd} _hover={{ bgColor: "#a0300a" }}
                            leftIcon={<FaPlus size={13} />}>
                            Birinchi dachani qo'shish
                        </Button>
                    </Box>
                )}

                {/* Dacha list */}
                {dachas.map(dacha => (
                    <Box key={dacha.id} mt="12px" bgColor="white" borderRadius="18px" p="16px"
                        boxShadow="0 2px 8px rgba(0,0,0,0.06)" border="1px solid #F0EBE6">
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box flex="1">
                                <Box display="flex" alignItems="center" gap="8px" mb="4px">
                                    <FaMapMarkerAlt color="#C03F0C" size={14} />
                                    <Text fontWeight="700" color="#1C110D" fontSize="15px">{dacha.name}</Text>
                                </Box>
                                <Text fontSize="13px" color="#9B614B" mb="2px">📍 {dacha.district}</Text>
                                {dacha.address && <Text fontSize="12px" color="#9B8E8A" mb="2px">🏠 {dacha.address}</Text>}
                                {dacha.capacity && <Text fontSize="12px" color="#9B8E8A" mb="2px">👥 {dacha.capacity} kishigacha</Text>}
                                {dacha.phone && <Text fontSize="12px" color="#9B8E8A" mb="2px">📞 {dacha.phone}</Text>}
                                {dacha.description && (
                                    <Text fontSize="12px" color="#9B8E8A" mt="6px" lineHeight="1.5">{dacha.description}</Text>
                                )}
                            </Box>
                            <Box display="flex" gap="8px" ml="10px">
                                <Box cursor="pointer" bgColor="#FFF5F0" borderRadius="10px" p="8px"
                                    onClick={() => openEdit(dacha)}>
                                    <FaEdit size={14} color="#C03F0C" />
                                </Box>
                                <Box cursor="pointer" bgColor="#FFF5F5" borderRadius="10px" p="8px"
                                    onClick={() => setDeleteConfirm(dacha.id)}>
                                    <FaTrash size={14} color="#E53E3E" />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                ))}

                {/* Delete confirm */}
                {deleteConfirm && (
                    <Box position="fixed" top="0" left="0" right="0" bottom="0" bgColor="rgba(0,0,0,0.5)"
                        zIndex={100} display="flex" alignItems="center" justifyContent="center" px="20px">
                        <Box bgColor="white" borderRadius="20px" p="24px" w="100%" maxW="340px" textAlign="center">
                            <Text fontSize="18px" fontWeight="800" color="#1C110D" mb="8px">O'chirilsinmi?</Text>
                            <Text fontSize="14px" color="#9B614B" mb="20px">
                                Bu dacha barcha oshpazlar sozlamalaridan ham o'chib ketadi
                            </Text>
                            <Box display="flex" gap="10px">
                                <Button flex="1" variant="outline" borderColor="#E8D5CC" color="#9B614B"
                                    borderRadius="14px" onClick={() => setDeleteConfirm(null)}>
                                    Yo'q
                                </Button>
                                <Button flex="1" bgColor="#E53E3E" color="white" borderRadius="14px"
                                    _hover={{ bgColor: "#C53030" }} onClick={() => handleDelete(deleteConfirm)}>
                                    Ha, o'chir
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Add/Edit Form */}
                {showForm && (
                    <Box position="fixed" top="0" left="0" right="0" bottom="0"
                        bgColor="rgba(0,0,0,0.5)" zIndex={100} display="flex"
                        alignItems="flex-end" justifyContent="center">
                        <Box bgColor="white" borderRadius="24px 24px 0 0" w="100%" maxW="480px"
                            p="24px" pb="40px" maxH="90vh" overflowY="auto">
                            <Text fontWeight="800" fontSize="18px" color="#1C110D" mb="18px">
                                {editing ? "Dachani tahrirlash" : "Yangi dacha qo'shish"}
                            </Text>

                            {/* Name */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color={errors.name ? "#E53E3E" : "#9B614B"}>
                                    Dacha nomi *
                                </Text>
                                <Box bgColor={errors.name ? "#FFF5F5" : "#FFF5F0"} borderRadius="12px" px="14px"
                                    border={`1.5px solid ${errors.name ? "#E53E3E" : "#F0E6E0"}`}
                                    style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.name} onChange={e => updateForm('name', e.target.value)}
                                        placeholder="Masalan: Bahor Bog' Dacha"
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                                {errors.name && <Text mt="3px" fontSize="12px" color="#E53E3E">⚠ {errors.name}</Text>}
                            </Box>

                            {/* District */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color={errors.district ? "#E53E3E" : "#9B614B"}>
                                    Tuman *
                                </Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border={`1.5px solid ${errors.district ? "#E53E3E" : "#F0E6E0"}`}
                                    style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <select value={form.district} onChange={e => updateForm('district', e.target.value)}
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent", cursor: "pointer" }}>
                                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </Box>
                            </Box>

                            {/* Address */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color="#9B614B">
                                    Manzil (ixtiyoriy)
                                </Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0"
                                    style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.address} onChange={e => updateForm('address', e.target.value)}
                                        placeholder="Ko'cha, mahalla..."
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                            </Box>

                            {/* Capacity */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color={errors.capacity ? "#E53E3E" : "#9B614B"}>
                                    Necha kishi sig'adi (ixtiyoriy)
                                </Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border={`1.5px solid ${errors.capacity ? "#E53E3E" : "#F0E6E0"}`}
                                    style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.capacity} onChange={e => updateForm('capacity', e.target.value.replace(/\D/g, ''))}
                                        placeholder="Masalan: 50"
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                            </Box>

                            {/* Phone */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color="#9B614B">
                                    Dacha telefoni (ixtiyoriy)
                                </Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0"
                                    style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.phone} onChange={e => updateForm('phone', e.target.value)}
                                        placeholder="+998 90 123 45 67"
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                            </Box>

                            {/* Description */}
                            <Box mb="20px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color="#9B614B">
                                    Tavsif (ixtiyoriy)
                                </Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0" style={{ minHeight: "80px", paddingTop: "12px" }}>
                                    <textarea value={form.description} onChange={e => updateForm('description', e.target.value.slice(0, 200))}
                                        placeholder="Dacha haqida qisqacha ma'lumot..."
                                        style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: "14px", color: "#1C110D", background: "transparent", minHeight: "56px" }} />
                                </Box>
                            </Box>

                            <Box display="flex" gap="10px">
                                <Button flex="1" variant="outline" borderColor="#E8D5CC" color="#9B614B"
                                    borderRadius="14px" fontWeight="700"
                                    onClick={() => { setShowForm(false); setEditing(null); }}>
                                    Bekor
                                </Button>
                                <Button flex="1" bgColor="#C03F0C" color="white" borderRadius="14px"
                                    fontWeight="700" _hover={{ bgColor: "#a0300a" }} onClick={handleSave}>
                                    {editing ? "Saqlash" : "Qo'shish"}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default AdminDachasPage;