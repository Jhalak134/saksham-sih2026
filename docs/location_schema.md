# Location Schema

## Purpose

This file defines the location information required by the AI-driven hyper-local business advisory system.

## Required Location Fields

| Field         | Meaning                   | Required? |
| ------------- | ------------------------- | --------- |
| `state`       | State name/code           | Yes       |
| `district`    | District name/code        | Yes       |
| `subdistrict` | Sub-district/block/tehsil | Yes       |
| `village`     | Village/town name         | Yes       |
| `latitude`    | Geographic latitude       | Yes       |
| `longitude`   | Geographic longitude      | Yes       |

## Geographic Analysis

The latitude and longitude of a village will be used as the center point for hyper-local analysis.

The system will later identify relevant locations, businesses, infrastructure, and markets within approximately:

* 5 km radius
* 10 km radius

## Data Quality Rules

* Latitude and longitude must be valid numeric coordinates.
* The original source of coordinates must be recorded.
* Location names should not be treated as unique identifiers by themselves.
* Geographic identifiers should be retained wherever available.
* Coordinates should be validated before being used for distance calculations.
