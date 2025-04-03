import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API_CONFIG from "../../config/apiConfig";

const DeleteInventory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#89198f',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY.BASE}/${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        
        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Inventory item has been deleted successfully.',
            confirmButtonColor: '#89198f',
          }).then(() => {
            navigate('/inventory-management');
          });
        } else {
          throw new Error(data.message || 'Failed to delete inventory item');
        }
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#89198f',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Delete Inventory Item</h1>
      <p className="mb-6 text-gray-600">Are you sure you want to delete this inventory item?</p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={confirmDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default DeleteInventory;
