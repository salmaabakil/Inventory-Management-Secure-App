package com.ecommerce.order.controller;

import com.ecommerce.order.client.ProductClient;
import com.ecommerce.order.client.ProductDto;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderItem;
import com.ecommerce.order.repository.OrderRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;

    public OrderController(OrderRepository orderRepository, ProductClient productClient) {
        this.orderRepository = orderRepository;
        this.productClient = productClient;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/my-orders")
    public List<Order> getMyOrders(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return orderRepository.findByUserId(userId);
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody List<OrderItem> items, @AuthenticationPrincipal Jwt jwt) {
        Order order = new Order();
        order.setUserId(jwt.getSubject()); // Set User ID from Token

        List<OrderItem> orderItems = new ArrayList<>();
        double totalAmount = 0.0;

        for (OrderItem itemRequest : items) {
            ProductDto product = productClient.getProductById(itemRequest.getProductId());

            if (product == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Product not found: " + itemRequest.getProductId());
            }
            if (product.getQuantity() < itemRequest.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Insufficient stock for product: " + product.getName());
            }

            // In a real app, we would decrement stock here via API call to ProductService
            productClient.reduceStock(product.getId(), itemRequest.getQuantity());

            OrderItem item = new OrderItem(product.getId(), itemRequest.getQuantity(), product.getPrice());
            orderItems.add(item);
            totalAmount += product.getPrice() * itemRequest.getQuantity();
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        return ResponseEntity.ok(orderRepository.save(order));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Order updateOrderStatus(@PathVariable Long id, @RequestBody String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        order.setStatus(status);
        return orderRepository.save(order);
    }
}
