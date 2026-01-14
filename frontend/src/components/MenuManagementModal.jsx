import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaTimes, FaPlus, FaTrash, FaSave } from 'react-icons/fa';
import hallService from '../services/hallService';

const MenuManagementModal = ({ hall, onClose, onSuccess }) => {
    const [menu, setMenu] = useState(hall.menu || []);
    const [newItem, setNewItem] = useState({ name: '', price: '', category: '', image: '' });
    const [loading, setLoading] = useState(false);

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.name || !newItem.price) return;
        setMenu([...menu, { ...newItem, price: Number(newItem.price) }]);
        setNewItem({ name: '', price: '', category: '', image: '' });
    };

    const handleDeleteItem = (index) => {
        const newMenu = menu.filter((_, i) => i !== index);
        setMenu(newMenu);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // We only send the menu array. The backend controller (as updated) handles it.
            // However, hallService.updateHall might expect FormData if we were uploading images.
            // Here we are just sending JSON data for the menu.
            // But hallService.updateHall checks if data is FormData.
            // We can send a plain object.

            await hallService.updateHall(hall._id, { menu });
            toast.success('Menu updated successfully!');
            onSuccess();
        } catch (error) {
            console.error("Failed to update menu", error);
            toast.error('Failed to update menu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        Manage Menu: {hall.name}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Add New Item Form */}
                    <form onSubmit={handleAddItem} className="bg-gray-50 p-4 rounded-lg border mb-6">
                        <h3 className="font-bold mb-3">Add New Item</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                placeholder="Item Name (e.g. Chicken Biryani)"
                                className="border p-2 rounded"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Price (Rs)"
                                className="border p-2 rounded"
                                value={newItem.price}
                                onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Category (Optional)"
                                className="border p-2 rounded"
                                value={newItem.category}
                                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Image URL (Optional)"
                                className="border p-2 rounded"
                                value={newItem.image}
                                onChange={e => setNewItem({ ...newItem, image: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-600">
                            <FaPlus /> Add Item
                        </button>
                    </form>

                    {/* Menu List */}
                    <div className="space-y-2">
                        <h3 className="font-bold mb-2">Current Menu ({menu.length} items)</h3>
                        {menu.length === 0 ? (
                            <p className="text-gray-500 italic">No items in menu.</p>
                        ) : (
                            menu.map((item, index) => (
                                <div key={index} className="flex justify-between items-center border p-3 rounded bg-white hover:shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />}
                                        <div>
                                            <p className="font-bold">{item.name}</p>
                                            <p className="text-sm text-gray-600">Rs {item.price} {item.category && `• ${item.category}`}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteItem(index)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Saving...' : <><FaSave /> Save Menu</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuManagementModal;
