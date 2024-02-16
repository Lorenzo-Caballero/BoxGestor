import React, { useEffect } from "react";
import { productsActions } from "../../store/products-slice";
import { useDispatch, useSelector } from "react-redux";
import { formatPrice } from '../../utils/helpers';


const Filters = ({ filters }) => {
  const dispatch = useDispatch();
  const minPrice = useSelector(state => state.products.minPrice);
  const maxPrice = useSelector((state) => state.products.maxPrice);

  const updateFilters = (e) => {
    let name = e.target.name;
    let value = e.target.value;
    if (name === 'category') {
      value = e.target.textContent;
    }
    if (name === 'company') {
      value = e.target.value.toLowerCase()
    }
    if (name === 'price') {
      value = Number(value);
    }
    if (name === 'disponible') {
      value = e.target.checked;
    }

    dispatch(productsActions.setFilters({
      ...filters,
      [e.target.name]: value
    }));
  };


  const clearFilters = () => {
    dispatch(productsActions.clearFilter());
  };

  useEffect(() => {
    dispatch(productsActions.filterProducts(filters));
  }, [dispatch, filters]);



  return (
    <div className="sticky top-0">
      <form>
        {/* search input */}
        <div className="mb-4">
          <input
            type="text"
            name="search"
            value={filters.text}
            placeholder="buscar"
            onChange={updateFilters}
            className="form-input rounded-lg bg-gray-200 border-0 pr-0"
          />
        </div>
        {/* category */}
        <div className="mb-6">
          <h4 className="mb-1 font-bold capitalize text-lg">categoria</h4>

        </div>

        {/* price */}
        <div className="mb-6">
          <h4 className="mb-1 font-bold capitalize text-lg">precio</h4>
          <p className="italic">{formatPrice(filters.price)}</p>
          <input
            type="range"
            name="price"
            id="price"
            onChange={updateFilters}
            min={minPrice}
            max={maxPrice}
            value={filters.price}
            className="form-range"
          />
        </div>
        {/* disponibles 
        <div className="mb-6">
          <label htmlFor="">Solo disponibles</label>
          <input
            type="checkbox"
            name="shipping"
            id="shipping"
            checked={filters.available}
            onChange={updateFilters}
            className="form-checkbox cursor-pointer ml-2"
          />
        </div>
        */}
      </form>
      <button
        type="button"
        className="bg-purple-500 text-white px-2 py-1 rounded-md font-semibold shadow-md"
        onClick={clearFilters}
      >
        Limpiar Filtros      </button>
    </div>
  );
};

export default Filters;
