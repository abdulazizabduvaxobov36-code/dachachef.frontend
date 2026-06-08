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

const AMENITIES = [
    { key: 'pool', label: '🏊 Basseyn' },
    { key: 'kids_pool', label: '👶 Bolalar basseyn' },
    { key: 'billiard', label: '🎱 Bilyard' },
    { key: 'tennis', label: '🏓 Stol tennis' },
    { key: 'ps', label: '🎮 PlayStation' },
    { key: 'wifi', label: '🌐 Wi-Fi' },
    { key: 'bbq', label: '🔥 Mangal/BBQ' },
    { key: 'tv', label: '📺 Smart TV' },
    { key: 'ac', label: '🌀 Konditsioner' },
    { key: 'tapshan', label: '🛋 Tapshan' },
    { key: 'kitchen', label: '🍽 Oshxona' },
    { key: 'parking', label: '🚗 Avtoturargoh' },
    { key: 'karaoke', label: '🎤 Karaoke' },
    { key: 'gazebo', label: '🌿 So\'ri/Soya' },
    { key: 'speaker', label: '🔊 Kolonka' },
    { key: 'beds', label: '🛏 Yotoqxona' },
];

const emptyDacha = () => ({
    id: '', name: '', district: "Andijon shahri", address: '',
    capacity: '', description: '', phone: '', price: '', image: '',
    amenities: []
});

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
        Store.fetchDachas().then(reload);
        reload();
        window.addEventListener('dachas-updated', reload);
        return () => window.removeEventListener('dachas-updated', reload);
    }, []);

    const openAdd = () => { setForm(emptyDacha()); setEditing(null); setErrors({}); setShowForm(true); };
    const openEdit = (d) => { setForm({ ...d, amenities: d.amenities || [] }); setEditing(d.id); setErrors({}); setShowForm(true); };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Dacha nomi shart";
        if (!form.district) e.district = "Tuman shart";
        return e;
    };

    const handleSave = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        if (editing) await Store.updateDacha(editing, { ...form });
        else await Store.addDacha({ ...form });
        setShowForm(false);
        setEditing(null);
        reload();
    };

    const handleDelete = async (id) => { await Store.removeDacha(id); setDeleteConfirm(null); reload(); };
    const upd = (f, v) => { setForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => { const e = { ...p }; delete e[f]; return e; }); };

    const toggleAmenity = (key) => {
        setForm(p => ({
            ...p,
            amenities: p.amenities.includes(key)
                ? p.amenities.filter(a => a !== key)
                : [...p.amenities, key]
        }));
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => upd('image', ev.target.result);
        reader.readAsDataURL(file);
    };

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
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
                    _hover={{ bgColor: "#a0300a" }}>Qo'shish</Button>
            </Box>

            <Box pb="30px" px={{ base: "14px", sm: "16px" }}>
                {dachas.length === 0 && !showForm && (
                    <Box mt="60px" textAlign="center">
                        <Text fontSize="50px" mb="12px">🏡</Text>
                        <Text color="#9B8E8A" fontWeight="700" fontSize="16px">Hali dacha qo'shilmagan</Text>
                        <Text color="#9B8E8A" fontSize="13px" mt="6px" mb="20px">
                            Andijondagi dachalarni qo'shing
                        </Text>
                        <Button bgColor="#C03F0C" color="white" borderRadius="16px"
                            fontWeight="700" onClick={openAdd} _hover={{ bgColor: "#a0300a" }}
                            leftIcon={<FaPlus size={13} />}>Birinchi dachani qo'shish</Button>
                    </Box>
                )}

                {dachas.map(dacha => (
                    <Box key={dacha.id} mt="12px" bgColor="white" borderRadius="18px"
                        overflow="hidden" boxShadow="0 2px 8px rgba(0,0,0,0.06)" border="1px solid #F0EBE6">
                        {dacha.image
                            ? <img src={dacha.image} alt={dacha.name} style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                            : <Box h="70px" bgColor="#F0E6E0" display="flex" alignItems="center" justifyContent="center" fontSize="30px">🏡</Box>
                        }
                        <Box p="14px">
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box flex="1">
                                    <Box display="flex" alignItems="center" gap="8px" mb="4px" flexWrap="wrap">
                                        <FaMapMarkerAlt color="#C03F0C" size={13} />
                                        <Text fontWeight="700" color="#1C110D" fontSize="15px">{dacha.name}</Text>
                                        {dacha.price && (
                                            <Box bgColor="#FFF0EC" borderRadius="20px" px="8px" py="2px">
                                                <Text fontSize="11px" fontWeight="700" color="#C03F0C">{dacha.price}</Text>
                                            </Box>
                                        )}
                                    </Box>
                                    <Text fontSize="12px" color="#9B614B" mb="2px">📍 {dacha.district}</Text>
                                    {dacha.capacity && <Text fontSize="12px" color="#9B8E8A" mb="2px">👥 {dacha.capacity} kishigacha</Text>}
                                    {dacha.phone && <Text fontSize="12px" color="#9B8E8A" mb="4px">📞 {dacha.phone}</Text>}
                                    {dacha.amenities?.length > 0 && (
                                        <Box display="flex" flexWrap="wrap" gap="4px" mt="6px">
                                            {dacha.amenities.slice(0, 6).map(key => {
                                                const a = AMENITIES.find(x => x.key === key);
                                                return a ? (
                                                    <Box key={key} bgColor="#FFF5F0" borderRadius="8px" px="7px" py="3px">
                                                        <Text fontSize="11px" color="#C03F0C" fontWeight="600">{a.label}</Text>
                                                    </Box>
                                                ) : null;
                                            })}
                                            {dacha.amenities.length > 6 && (
                                                <Box bgColor="#F0F0F0" borderRadius="8px" px="7px" py="3px">
                                                    <Text fontSize="11px" color="#666">+{dacha.amenities.length - 6}</Text>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
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

                {deleteConfirm && (
                    <Box position="fixed" top="0" left="0" right="0" bottom="0" bgColor="rgba(0,0,0,0.5)"
                        zIndex={100} display="flex" alignItems="center" justifyContent="center" px="20px">
                        <Box bgColor="white" borderRadius="20px" p="24px" w="100%" maxW="340px" textAlign="center">
                            <Text fontSize="18px" fontWeight="800" color="#1C110D" mb="8px">O'chirilsinmi?</Text>
                            <Text fontSize="14px" color="#9B614B" mb="20px">Bu dacha o'chib ketadi</Text>
                            <Box display="flex" gap="10px">
                                <Button flex="1" variant="outline" borderColor="#E8D5CC" color="#9B614B"
                                    borderRadius="14px" onClick={() => setDeleteConfirm(null)}>Yo'q</Button>
                                <Button flex="1" bgColor="#E53E3E" color="white" borderRadius="14px"
                                    _hover={{ bgColor: "#C53030" }} onClick={() => handleDelete(deleteConfirm)}>Ha, o'chir</Button>
                            </Box>
                        </Box>
                    </Box>
                )}

                {showForm && (
                    <Box position="fixed" top="0" left="0" right="0" bottom="0"
                        bgColor="rgba(0,0,0,0.5)" zIndex={100} display="flex"
                        alignItems="flex-end" justifyContent="center">
                        <Box bgColor="white" borderRadius="24px 24px 0 0" w="100%" maxW="480px"
                            p="20px" pb="40px" maxH="93vh" overflowY="auto">
                            <Text fontWeight="800" fontSize="17px" color="#1C110D" mb="16px">
                                {editing ? "Dachani tahrirlash" : "Yangi dacha qo'shish"}
                            </Text>

                            {/* Rasm */}
                            <Box mb="14px">
                                <Text mb="6px" fontWeight="600" fontSize="12px" color="#9B614B">Rasm</Text>
                                <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
                                {form.image
                                    ? <Box position="relative" borderRadius="14px" overflow="hidden" cursor="pointer" onClick={() => imgRef.current.click()}>
                                        <img src={form.image} alt="" style={{ width: "100%", height: "160px", objectFit: "cover" }} />
                                        <Box position="absolute" bottom="8px" right="8px" bgColor="rgba(0,0,0,0.6)"
                                            borderRadius="10px" px="10px" py="6px" display="flex" alignItems="center" gap="6px">
                                            <FaCamera size={11} color="white" />
                                            <Text fontSize="12px" color="white" fontWeight="600">O'zgartirish</Text>
                                        </Box>
                                    </Box>
                                    : <Box bgColor="#FFF5F0" borderRadius="14px" h="110px" border="2px dashed #F0E6E0"
                                        display="flex" flexDir="column" alignItems="center" justifyContent="center"
                                        gap="6px" cursor="pointer" onClick={() => imgRef.current.click()}>
                                        <FaCamera size={22} color="#C03F0C" />
                                        <Text fontSize="13px" color="#C03F0C" fontWeight="600">Rasm yuklash</Text>
                                    </Box>
                                }
                            </Box>

                            {/* Nomi */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color={errors.name ? "#E53E3E" : "#9B614B"}>Dacha nomi *</Text>
                                <Box bgColor={errors.name ? "#FFF5F5" : "#FFF5F0"} borderRadius="12px" px="14px"
                                    border={`1.5px solid ${errors.name ? "#E53E3E" : "#F0E6E0"}`}
                                    style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.name} onChange={e => upd('name', e.target.value)}
                                        placeholder="Masalan: Dacha Best"
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                                {errors.name && <Text mt="3px" fontSize="12px" color="#E53E3E">⚠ {errors.name}</Text>}
                            </Box>

                            {/* Tuman */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color="#9B614B">Tuman *</Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0" style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <select value={form.district} onChange={e => upd('district', e.target.value)}
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent", cursor: "pointer" }}>
                                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </Box>
                            </Box>

                            {/* Narx */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color="#9B614B">Narx (ixtiyoriy)</Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0" style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.price} onChange={e => upd('price', e.target.value)}
                                        placeholder="Masalan: Kelishilgan holda yoki 150,000 so'm/kun"
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                            </Box>

                            {/* Manzil */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color="#9B614B">Manzil (ixtiyoriy)</Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0" style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.address} onChange={e => upd('address', e.target.value)}
                                        placeholder="Ko'cha, mahalla..."
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                            </Box>

                            {/* Sig'im */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color="#9B614B">Necha kishi sig'adi (ixtiyoriy)</Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0" style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.capacity} onChange={e => upd('capacity', e.target.value.replace(/\D/g, ''))}
                                        placeholder="Masalan: 30"
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                            </Box>

                            {/* Telefon */}
                            <Box mb="12px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color="#9B614B">Dacha telefoni (ixtiyoriy)</Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0" style={{ height: "46px", display: "flex", alignItems: "center" }}>
                                    <input value={form.phone} onChange={e => upd('phone', e.target.value)}
                                        placeholder="+998 90 123 45 67"
                                        style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                </Box>
                            </Box>

                            {/* Qulayliklar */}
                            <Box mb="14px">
                                <Text mb="8px" fontWeight="600" fontSize="12px" color="#9B614B">
                                    Qulayliklar {form.amenities.length > 0 && <Text as="span" color="#C03F0C">({form.amenities.length} ta tanlandi)</Text>}
                                </Text>
                                <Box display="flex" flexWrap="wrap" gap="8px">
                                    {AMENITIES.map(a => (
                                        <Box key={a.key} px="12px" py="8px" borderRadius="12px" cursor="pointer"
                                            bgColor={form.amenities.includes(a.key) ? "#C03F0C" : "#FFF5F0"}
                                            border={`1.5px solid ${form.amenities.includes(a.key) ? "#C03F0C" : "#F0E6E0"}`}
                                            onClick={() => toggleAmenity(a.key)}>
                                            <Text fontSize="12px" fontWeight="600"
                                                color={form.amenities.includes(a.key) ? "white" : "#9B614B"}>
                                                {a.label}
                                            </Text>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {/* Tavsif */}
                            <Box mb="16px">
                                <Text mb="5px" fontWeight="600" fontSize="12px" color="#9B614B">Tavsif (ixtiyoriy)</Text>
                                <Box bgColor="#FFF5F0" borderRadius="12px" px="14px"
                                    border="1.5px solid #F0E6E0" style={{ minHeight: "120px", paddingTop: "12px", paddingBottom: "12px" }}>
                                    <textarea value={form.description} onChange={e => upd('description', e.target.value.slice(0, 1000))}
                                        placeholder="Dacha haqida batafsil ma'lumot — qulayliklar, qoidalar, muhit..."
                                        style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: "14px", color: "#1C110D", background: "transparent", minHeight: "96px", lineHeight: "1.6" }} />
                                </Box>
                                <Text fontSize="11px" color="#9B8E8A" textAlign="right" mt="4px">
                                    {form.description.length}/1000
                                </Text>
                            </Box>

                            <Box display="flex" gap="10px">
                                <Button flex="1" variant="outline" borderColor="#E8D5CC" color="#9B614B"
                                    borderRadius="14px" fontWeight="700"
                                    onClick={() => { setShowForm(false); setEditing(null); }}>Bekor</Button>
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