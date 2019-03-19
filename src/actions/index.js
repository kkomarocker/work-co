import shop from "../api/shop";
import * as types from "../constants/ActionTypes";
import axios from "axios";

const receiveProducts = products => ({
  type: types.RECEIVE_PRODUCTS,
  products: products
});

const addToCartUnsafe = productId => ({
  type: types.ADD_TO_CART,
  productId
});

const itemRemovedFromCart = (list, qtyObj) => ({
  type: types.REMOVE_PRODUCT,
  list,
  qtyObj
});

const inputQty = qty => dispatch => {
  dispatch({ type: types.INPUT_QTY, qty });
};

const itemQtyUpdated = qtyObj => dispatch => {
  dispatch({ type: types.UPDATE_QTY, qtyObj });
};

export const getAllProducts = () => async dispatch => {
  const url = "http://tech.work.co/shopping-cart/products.json";
  const { data } = await axios.get(url);

  // loading product images not working for some reason..
  const imgArr = [
    "/assets/chronograph.jpg",
    "/assets/quartz.jpg",
    "/assets/weekender.jpg"
  ];

  data.map(item => (item.price = item.price.value));
  data.map((item, i) => (item.src = imgArr[i]));

  dispatch(receiveProducts(data));
};

export const addToCart = productId => (dispatch, getState) => {
  if (getState().products.byId[productId].inventory > 0) {
    dispatch(addToCartUnsafe(productId));
  }
};

export const checkout = products => (dispatch, getState) => {
  const { cart } = getState();

  dispatch({
    type: types.CHECKOUT_REQUEST
  });
  shop.buyProducts(products, () => {
    dispatch({
      type: types.CHECKOUT_SUCCESS,
      cart
    });
    // Replace the line above with line below to rollback on failure:
    // dispatch({ type: types.CHECKOUT_FAILURE, cart })
  });
};

export const removeItem = productId => (dispatch, getState) => {
  const { addedIds, quantityById, qtyInput } = getState().cart;
  const { byId } = getState().products;
  const intQty = parseInt(qtyInput);

  if (quantityById[productId] >= intQty) {
    if (qtyInput) {
      quantityById[productId] -= intQty;
      byId[productId].inventory += intQty;
    } else {
      quantityById[productId] -= 1;
      byId[productId].inventory += 1;
    }
  } else {
    alert("Removing too many items at once. Please adjust qty.");
  }

  const newIdList =
    quantityById[productId] === 0
      ? addedIds.filter(id => id !== productId)
      : addedIds;

  dispatch(itemRemovedFromCart(newIdList, quantityById));
};

export const qtyChange = qty => dispatch => {
  dispatch(inputQty(qty));
};

export const updateQty = (productId, textVal) => (dispatch, getState) => {
  const { initialQty, quantityById } = getState().cart;
  const { byId } = getState().products;
  const intQty = parseInt(initialQty);

  if (textVal === "+") {
    if (quantityById[productId] && byId[productId].inventory) {
      if (byId[productId].inventory >= intQty) {
        quantityById[productId] += intQty;
        byId[productId].inventory -= intQty;
      } else {
        alert("Stock qty is not sufficient. Please adjust qty.");
      }
    }
  } else {
    if (quantityById[productId]) {
      if (byId[productId].inventory <= intQty) {
        quantityById[productId] -= intQty;
        byId[productId].inventory += intQty;
      } else {
        alert("Stock qty is not sufficient. Please adjust qty.");
      }
    }
  }

  dispatch(itemQtyUpdated(quantityById));
};
