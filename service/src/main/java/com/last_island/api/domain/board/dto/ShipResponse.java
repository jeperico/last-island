package com.last_island.api.domain.board.dto;

public record ShipResponse(String type, String orientation, int row, int col, int size) {}
