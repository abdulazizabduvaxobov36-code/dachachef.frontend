import { Box, Button, Text } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import Store from '../store';

const DISTRICTS = [
    "Andijon shahri", "Oltinko'l tumani", "Asaka tumani", "Baliqchi tumani",
    "Bo'ston tumani", "Buloqboshi tumani", "Izboskan tumani", "Jalolquduq tumani",
    "Xo'jaobod tumani", "Marhamat tumani", "Mashrabov tumani", "Paxtaobod tumani",
    "Qo'rg'ontepa tumani", "Shahrixon tumani", "Ulug'nor tumani",
    "Xonobod shahri", "Imom Ota"
];

const emptyDacha = () => ({
    id: '', name: '', district: "Andijon shahri", address: '',
    capacity: '', description: '', phone: '', price: '', image: ''
});

const Field = ({ label, error, children }) => (
    <Box mb="12px">
        <Text mb="5px" fontWeight="600" fontSize="12px" color={error ? "#E53E3E" : "#9B614B"}>
            {label}
        </Text>
        {children}
        {error && <Text mt="3px" fontSize="12px" color="#E53E3E">⚠ {error}</Text>}
    </Box>
);

const Input = ({ value, onChange, placeholder, type = "text" }) => (
    <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
        border="1.5px solid #F0E6E0" style={{ height: "46px", display: "flex", alignItems: "center" }}>
        <input value={value} onChange={onChange} placeholder={placeholder} type={type}
            style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
    </Box>
);

const AdminDachasPage = () => {
    const navigate = useNavigate();
    const [dachas, setDachas] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyDacha());
    const [errors, setErrors] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const imgRef = useRef(null);

    const reload = () => setDachas(Store.getDachas());

    useEffect(() => {
        reload();
        window.addEventListener('dachas-updated', reload);
        return () => window.removeEventListener('dachas-updated', reload);
    }, []);

    const openAdd = () => { setForm(emptyDacha()); setEditing(null); setErrors({}); setShowForm(true); };
    const openEdit = (d) => { setForm({ ...d }); setEditing(d.id); setErrors({}); setShowForm(true); };

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
        if (editing) Store.updateDacha(editing, { ...form });
        else Store.addDacha({ ...form, id: Date.now().toString() });
        setShowForm(false);
        setEditing(null);
        reload();
    };

    const handleDelete = (id) => { Store.removeDacha(id); setDeleteConfirm(null); reload(); };
    const upd = (f, v) => { setForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => { const e = { ...p }; delete e[f]; return e; }); };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => upd('image', ev.target.result);
        reader.readAsDataURL(file);
    };

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            {/* Header */}
            <Box bgColor="white" px={{ base: "14px", sm: "18px" }} py={{ base: "12px", sm: "14px" }}
                display="flex" alignItems="center" justifyContent="space-between" boxShadow="0 1px 0 #F0EBE6">
                <Box display="flex" alignItems="center" gap="12px">
                    <Box bgColor="#FFF0EC" borderRadius="full" display="flex" alignItems="center"
                        justifyContent="center" cursor="pointer" onClick={() => navigate('/admin')}
                        style={{ width: "clamp(32px,9vw,38px)", height: "clamp(32px,9vw,38px)" }}>
                        <FaArrowLeft style={{ fontSize: "clamp(12px,3vw,14px)", color: "#1C110D" }} />
                    </Box>
                    <Box>
                        <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(15px,4.2vw,18px)" }}>
                            Dachalar boshqaruvi
                        </Text>
                        <Text fontSize="12px" color="#9B614B">{dachas.length} ta dacha</Text>
                    </Box>
                </Box>
                <Button bgColor="#C03F0C" color="white" borderRadius="14px" size="sm"
                    fontWeight="700" onClick={openAdd} leftIcon={<FaPlus size={11} />}
                    _hover={{ bgColor: "#a0300a" }}>
                    Qo'shish
                </Button>
            </Box>

            <Box pb="30px" px={{ base: "14px", sm: "16px" }}>
                {dachas.length === 0 && !showForm && (
                    <Box mt="60px" textAlign="center">
                        <Text fontSize="50px" mb="12px">🏡</Text>
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

                {dachas.map(dacha => (
                    <Box key={dacha.id} mt="12px" bgColor="white" borderRadius="18px"
                        overflow="hidden" boxShadow="0 2px 8px rgba(0,0,0,0.06)" border="1px solid #F0EBE6">
                        {dacha.image
                            ? <img src={dacha.image} alt={dacha.name} style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                            : <Box h="80px" bgColor="#F0E6E0" display="flex" alignItems="center" justifyContent="center" fontSize="32px">🏡</Box>
                        }
                        <Box p="14px">
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box flex="1">
                                    <Box display="flex" alignItems="center" gap="8px" mb="4px">
                                        <FaMapMarkerAlt color="#C03F0C" size={13} />
                                        <Text fontWeight="700" color="#1C110D" fontSize="15px">{dacha.name}</Text>
                                        {dacha.price && (
                                            <Box bgColor="#FFF0EC" borderRadius="20px" px="8px" py="2px" ml="4px">
                                                <Text fontSize="11px" fontWeight="700" color="#C03F0C">{dacha.price}</Text>
                                            </Box>
                                        )}
                                    </Box>
                                    <Text fontSize="12px" color="#9B614B" mb="2px">📍 {dacha.district}</Text>
                                    {dacha.address && <Text fontSize="12px" color="#9B8E8A" mb="2px">🏠 {dacha.address}</Text>}
                                    {dacha.capacity && <Text fontSize="12px" color="#9B8E8A" mb="2px">👥 {dacha.capacity} kishigacha</Text>}
                                    {dacha.phone && <Text fontSize="12px" color="#9B8E8A" mb="2px">📞 {dacha.phone}</Text>}
                                    {dacha.description && <Text fontSize="12px" color="#9B8E8A" mt="6px" lineHeight="1.5">{dacha.description}</Text>}
                                </Box>
                                <Box display="flex" gap="8px" ml="10px">
                                    <Box cursor="pointer" bgColor="#FFF5F0" borderRadius="10px" p="8px" onClick={() => openEdit(dacha)}>
                                        <FaEdit size={14} color="#C03F0C" />
                                    </Box>
                                    <Box cursor="pointer" bgColor="#FFF5F5" borderRadius="10px" p="8px" onClick={() => setDeleteConfirm(dacha.id)}>
                                        <FaTrash size={14} color="#E53E3E" />
                                    </Box>
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
                                    borderRadius="14px" onClick={() => setDeleteConfirm(null)}>Yo'q</Button>
                                <Button flex="1" bgColor="#E53E3E" color="white" borderRadius="14px"
                                    _hover={{ bgColor: "#C53030" }} onClick={() => handleDelete(deleteConfirm)}>Ha, o'chir</Button>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Form */}
                {showForm && (
                    <Box position="fixed" top="0" left="0" right="0" bottom="0"
                        bgColor="rgba(0,0,0,0.5)" zIndex={100} display="flex"
                        alignItems="flex-end" justifyContent="center">
                        <Box bgColor="white" borderRadius="24px 24px 0 0" w="100%" maxW="480px"
                            p="24px" pb="40px" maxH="92vh" overflowY="auto">
                            <Text fontWeight="800" fontSize="18px" color="#1C110D" mb="18px">
                                {editing ? "Dachani tahrirlash" : "Yangi dacha qo'shish"}
                            </Text>

                            {/* Rasm */}
                            <Box mb="16px">
                                <Text mb="8px" fontWeight="600" fontSize="12px" color="#9B614B">Rasm</Text>
                                <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
                                {form.image
                                    ? <Box position="relative" borderRadius="14px" overflow="hidden" cursor="pointer"
                                        onClick={() => imgRef.current.click()}>
                                        <img src={form.image} alt="" style={{ width: "100%", height: "160px", objectFit: "cover" }} />
                                        <Box position="absolute" bottom="8px" right="8px" bgColor="rgba(0,0,0,0.6)"
                                            borderRadius="10px" px="10px" py="6px" display="flex" alignItems="center" gap="6px">
                                            <FaCamera size={12} color="white" />
                                            <Text fontSize="12px" color="white" fontWeight="600">O'zgartirish</Text>
                                        </Box>
                                    </Box>
                                    : <Box bgColor="#FFF5F0" borderRadius="14px" h="120px" border="2px dashed #F0E6E0"
                                        display="flex" flexDir="column" alignItems="center" justifyContent="center"
                                        gap="8px" cursor="pointer" onClick={() => imgRef.current.click()}>
                                        <FaCamera size={24} color="#C03F0C" />
                                        <Text fontSize="13px" color="#C03F0C" fontWeight="600">Rasm yuklash</Text>
                                    </Box>
                                }
                            </Box>

                            {/* Nomi */}
                            <Field label="Dacha nomi *" error={errors.name}>
                                <Box bgColor={errors.name ? "#FFF5F5" : "#FFF5F0"} borderRadius="12px" px="14px"
                                    border={`1.5px solid ${errors.name ? "#E53E3E" : "#F0E6E0"}`}
                                    style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.name} onChange={e => upd('name', e.target.value)}
                                        placeholder="Masalan: Bahor Bog' Dacha"
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                            </Field>

                            {/* Tuman */}
                            <Field label="Tuman *" error={errors.district}>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0" style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <select value={form.district} onChange={e => upd('district', e.target.value)}
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent", cursor: "pointer" }}>
                                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </Box>
                            </Field>

                            {/* Narx */}
                            <Field label="Narx (ixtiyoriy)">
                                <Input value={form.price} onChange={e => upd('price', e.target.value)}
                                    placeholder="Masalan: 150,000 so'm/kun yoki Kelishilgan" />
                            </Field>

                            {/* Manzil */}
                            <Field label="Manzil (ixtiyoriy)">
                                <Input value={form.address} onChange={e => upd('address', e.target.value)}
                                    placeholder="Ko'cha, mahalla..." />
                            </Field>

                            {/* Sig'im */}
                            <Field label="Necha kishi sig'adi (ixtiyoriy)" error={errors.capacity}>
                                <Box bgColor={errors.capacity ? "#FFF5F5" : "#FFF5F0"} borderRadius="12px" px="14px"
                                    border={`1.5px solid ${errors.capacity ? "#E53E3E" : "#F0E6E0"}`}
                                    style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.capacity} onChange={e => upd('capacity', e.target.value.replace(/\D/g, ''))}
                                        placeholder="Masalan: 50"
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                            </Field>

                            {/* Telefon */}
                            <Field label="Dacha telefoni (ixtiyoriy)">
                                <Input value={form.phone} onChange={e => upd('phone', e.target.value)}
                                    placeholder="+998 90 123 45 67" />
                            </Field>

                            {/* Tavsif */}
                            <Field label="Tavsif (ixtiyoriy)">
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0" style={{ minHeight: "90px", paddingTop: "12px" }}>
                                    <textarea value={form.description} onChange={e => upd('description', e.target.value.slice(0, 300))}
                                        placeholder="Qulayliklar, qoidalar, muhit haqida..."
                                        style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: "14px", color: "#1C110D", background: "transparent", minHeight: "66px" }} />
                                </Box>
                                <Text fontSize="11px" color="#9B8E8A" textAlign="right" mt="4px">
                                    {form.description.length}/300
                                </Text>
                            </Field>

                            <Box display="flex" gap="10px" mt="4px">
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